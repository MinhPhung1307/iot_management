import { AppError } from '../../middleware/AppError';

jest.mock('../../models/Device', () => {
  const mockModel: any = {
    findByPk: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('../../models/CommandHistory', () => {
  const mockModel: any = {
    create: jest.fn(),
    findAll: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('../../mqtt/mqttClient', () => ({
  mqttClient: {
    sendCommand: jest.fn(),
  },
}));

jest.mock('../../websocket/socket', () => ({
  serverSocket: {
    emitDeviceUpdate: jest.fn(),
  },
}));

import Device from '../../models/Device';
import CommandHistory from '../../models/CommandHistory';
import { mqttClient } from '../../mqtt/mqttClient';
import { serverSocket } from '../../websocket/socket';
import { sendCommand, getCommandHistory } from '../../services/command.service';

const mockDevice = Device as any;
const mockCommandHistory = CommandHistory as any;
const mockMqttClient = mqttClient as jest.Mocked<typeof mqttClient>;
const mockServerSocket = serverSocket as jest.Mocked<typeof serverSocket>;

describe('command.service', () => {
  const fakeDevice = {
    id: 1,
    name: 'Sensor-01',
    type: 'sensor',
    status: 'offline',
    lastSeen: null,
    update: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendCommand', () => {
    it('should send command and return success', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});

      const result = await sendCommand(
        1,
        { command: 'get_status', params: { key: 'value' } },
        1
      );

      expect(mockDevice.findByPk).toHaveBeenCalledWith(1);
      expect(mockMqttClient.sendCommand).toHaveBeenCalledWith(
        'Sensor-01',
        expect.objectContaining({
          command: 'get_status',
          params: { key: 'value' },
          timestamp: expect.any(String),
        })
      );
      expect(result.message).toBe('Command sent to device Sensor-01');
      expect(result.command).toBe('get_status');
    });

    it('should save command history', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});

      await sendCommand(1, { command: 'turn_on' }, 1);

      expect(mockCommandHistory.create).toHaveBeenCalledWith({
        deviceId: 1,
        command: 'turn_on',
        params: undefined,
        status: 'sent',
        sentBy: 1,
      });
    });

    it('should handle turn_on command - update device status', async () => {
      const offlineDevice = { ...fakeDevice, update: jest.fn() };
      mockDevice.findByPk.mockResolvedValue(offlineDevice);
      mockCommandHistory.create.mockResolvedValue({});

      await sendCommand(1, { command: 'turn_on' }, 1);

      expect(offlineDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'online',
        })
      );
      expect(mockServerSocket.emitDeviceUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          name: 'Sensor-01',
          status: 'online',
        })
      );
    });

    it('should handle turn_off command - update device status', async () => {
      const onlineDevice = {
        ...fakeDevice,
        status: 'online',
        update: jest.fn(),
      };
      mockDevice.findByPk.mockResolvedValue(onlineDevice);
      mockCommandHistory.create.mockResolvedValue({});

      await sendCommand(1, { command: 'turn_off' }, 1);

      expect(onlineDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'offline',
        })
      );
      expect(mockServerSocket.emitDeviceUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          name: 'Sensor-01',
          status: 'offline',
        })
      );
    });

    it('should not update status for non turn_on/turn_off commands', async () => {
      const device = { ...fakeDevice, update: jest.fn() };
      mockDevice.findByPk.mockResolvedValue(device);
      mockCommandHistory.create.mockResolvedValue({});

      await sendCommand(1, { command: 'reboot' }, 1);

      expect(device.update).not.toHaveBeenCalled();
      expect(mockServerSocket.emitDeviceUpdate).not.toHaveBeenCalled();
    });

    it('should not fail if command history save fails', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockRejectedValue(new Error('DB error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await sendCommand(1, { command: 'turn_on' }, 1);

      expect(result.message).toBe('Command sent to device Sensor-01');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Command history not saved:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should throw NotFoundError if device does not exist', async () => {
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(
        sendCommand(999, { command: 'turn_on' }, 1)
      ).rejects.toThrow(AppError);

      try {
        await sendCommand(999, { command: 'turn_on' }, 1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });

    it('should return device info in response', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});

      const result = await sendCommand(1, { command: 'turn_on' }, 1);

      expect(result.device).toEqual({
        id: 1,
        name: 'Sensor-01',
        status: 'offline',
        lastSeen: null,
      });
    });
  });

  describe('getCommandHistory', () => {
    it('should return command history with default pagination', async () => {
      const fakeCommands = [{ id: 1, command: 'turn_on' }];
      mockCommandHistory.findAll.mockResolvedValue(fakeCommands);

      const result = await getCommandHistory(1, {});

      expect(mockCommandHistory.findAll).toHaveBeenCalledWith({
        where: { deviceId: 1 },
        include: [
          { model: Device, as: 'device', attributes: ['name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 50,
        offset: 0,
      });
      expect(result.commands).toBe(fakeCommands);
    });

    it('should apply custom pagination', async () => {
      mockCommandHistory.findAll.mockResolvedValue([]);

      await getCommandHistory(1, { limit: '10', offset: '20' });

      expect(mockCommandHistory.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );
    });
  });
});
