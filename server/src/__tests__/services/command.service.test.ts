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

jest.mock('../../strategies/commandStrategies', () => ({
  getCommandStrategy: jest.fn(),
}));

jest.mock('../../services/pubsub.service', () => ({
  pubsub: { publish: jest.fn(), subscribe: jest.fn() },
}));

import Device from '../../models/Device';
import CommandHistory from '../../models/CommandHistory';
import { mqttClient } from '../../mqtt/mqttClient';
import { getCommandStrategy } from '../../strategies/commandStrategies';
import { pubsub } from '../../services/pubsub.service';
import { sendCommand, getCommandHistory } from '../../services/command.service';

const mockDevice = Device as any;
const mockCommandHistory = CommandHistory as any;
const mockMqttClient = mqttClient as jest.Mocked<typeof mqttClient>;
const mockGetCommandStrategy = getCommandStrategy as jest.MockedFunction<typeof getCommandStrategy>;

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
      mockGetCommandStrategy.mockReturnValue({ execute: jest.fn() });

      const result = await sendCommand(
        1,
        { command: 'get_status', params: { key: 'value' } },
        1
      );

      expect(mockDevice.findByPk).toHaveBeenCalledWith(1);
      expect(mockGetCommandStrategy).toHaveBeenCalledWith('get_status');
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
      mockGetCommandStrategy.mockReturnValue({ execute: jest.fn() });

      await sendCommand(1, { command: 'turn_on' }, 1);

      expect(mockCommandHistory.create).toHaveBeenCalledWith({
        deviceId: 1,
        command: 'turn_on',
        params: undefined,
        status: 'sent',
        sentBy: 1,
      });
    });

    it('should call turn_on strategy execute', async () => {
      const mockExecute = jest.fn();
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});
      mockGetCommandStrategy.mockReturnValue({ execute: mockExecute });

      await sendCommand(1, { command: 'turn_on' }, 1);

      expect(mockGetCommandStrategy).toHaveBeenCalledWith('turn_on');
      expect(mockExecute).toHaveBeenCalledWith({
        device: fakeDevice,
        params: undefined,
        pubsub,
      });
    });

    it('should call turn_off strategy execute', async () => {
      const mockExecute = jest.fn();
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});
      mockGetCommandStrategy.mockReturnValue({ execute: mockExecute });

      await sendCommand(1, { command: 'turn_off' }, 1);

      expect(mockGetCommandStrategy).toHaveBeenCalledWith('turn_off');
      expect(mockExecute).toHaveBeenCalledWith({
        device: fakeDevice,
        params: undefined,
        pubsub,
      });
    });

    it('should call default strategy for unknown commands', async () => {
      const mockExecute = jest.fn();
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});
      mockGetCommandStrategy.mockReturnValue({ execute: mockExecute });

      await sendCommand(1, { command: 'reboot' }, 1);

      expect(mockGetCommandStrategy).toHaveBeenCalledWith('reboot');
      expect(mockExecute).toHaveBeenCalledWith({
        device: fakeDevice,
        params: undefined,
        pubsub,
      });
    });

    it('should not fail if command history save fails', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockRejectedValue(new Error('DB error'));
      mockGetCommandStrategy.mockReturnValue({ execute: jest.fn() });

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
      mockGetCommandStrategy.mockReturnValue({ execute: jest.fn() });

      const result = await sendCommand(1, { command: 'turn_on' }, 1);

      expect(result.device).toEqual({
        id: 1,
        name: 'Sensor-01',
        status: 'offline',
        lastSeen: null,
      });
    });

    it('should pass params to strategy', async () => {
      const mockExecute = jest.fn();
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockCommandHistory.create.mockResolvedValue({});
      mockGetCommandStrategy.mockReturnValue({ execute: mockExecute });

      await sendCommand(1, { command: 'set_mode', params: { mode: 'eco' } }, 1);

      expect(mockExecute).toHaveBeenCalledWith({
        device: fakeDevice,
        params: { mode: 'eco' },
        pubsub,
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
