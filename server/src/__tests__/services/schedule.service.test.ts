import { AppError } from '../../middleware/AppError';

jest.mock('../../models/Schedule', () => {
  const mockModel: any = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('../../models/Device', () => {
  const mockModel: any = {
    findByPk: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('../../mqtt/mqttClient', () => ({
  mqttClient: {
    sendCommand: jest.fn(),
  },
}));

import Schedule from '../../models/Schedule';
import Device from '../../models/Device';
import { mqttClient } from '../../mqtt/mqttClient';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  executeSchedule,
} from '../../services/schedule.service';

const mockSchedule = Schedule as any;
const mockDevice = Device as any;
const mockMqttClient = mqttClient as jest.Mocked<typeof mqttClient>;

describe('schedule.service', () => {
  const fakeDevice = {
    id: 1,
    name: 'Sensor-01',
    type: 'sensor',
    status: 'online',
  };

  const fakeSchedule = {
    id: 1,
    deviceId: 1,
    name: 'Morning Check',
    command: 'get_status',
    params: { key: 'value' },
    cronExpression: '0 8 * * *',
    scheduledTime: new Date('2024-01-01T08:00:00'),
    isActive: true,
    lastRun: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchedules', () => {
    it('should return all schedules without filter', async () => {
      mockSchedule.findAll.mockResolvedValue([fakeSchedule]);

      const result = await getSchedules({});

      expect(mockSchedule.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          order: [['createdAt', 'DESC']],
        })
      );
      expect(result.schedules).toEqual([fakeSchedule]);
    });

    it('should filter by deviceId', async () => {
      mockSchedule.findAll.mockResolvedValue([]);

      await getSchedules({ deviceId: '1' });

      expect(mockSchedule.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deviceId: '1' },
        })
      );
    });
  });

  describe('getScheduleById', () => {
    it('should return schedule with device info', async () => {
      mockSchedule.findByPk.mockResolvedValue(fakeSchedule);

      const result = await getScheduleById(1);

      expect(mockSchedule.findByPk).toHaveBeenCalledWith(1, {
        include: [
          expect.objectContaining({
            model: mockDevice,
            as: 'device',
            attributes: ['id', 'name', 'type', 'status'],
          }),
        ],
      });
      expect(result.schedule).toBe(fakeSchedule);
    });

    it('should throw NotFoundError when schedule does not exist', async () => {
      mockSchedule.findByPk.mockResolvedValue(null);

      await expect(getScheduleById(999)).rejects.toThrow(AppError);

      try {
        await getScheduleById(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('Schedule not found');
      }
    });
  });

  describe('createSchedule', () => {
    it('should create schedule when device exists', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockSchedule.create.mockResolvedValue(fakeSchedule);

      const result = await createSchedule(
        {
          deviceId: 1,
          name: 'Morning Check',
          command: 'get_status',
          params: { key: 'value' },
          cronExpression: '0 8 * * *',
          scheduledTime: '2024-01-01T08:00:00.000Z',
        },
        1
      );

      expect(mockDevice.findByPk).toHaveBeenCalledWith(1);
      expect(mockSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 1,
          name: 'Morning Check',
          command: 'get_status',
          params: { key: 'value' },
          cronExpression: '0 8 * * *',
          scheduledTime: new Date('2024-01-01T08:00:00.000Z'),
          createdBy: 1,
        })
      );
      expect(result.schedule).toBe(fakeSchedule);
    });

    it('should throw NotFoundError if device does not exist', async () => {
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(
        createSchedule({ deviceId: 999, name: 'Test', command: 'test' }, 1)
      ).rejects.toThrow(AppError);

      try {
        await createSchedule({ deviceId: 999, name: 'Test', command: 'test' }, 1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }

      expect(mockSchedule.create).not.toHaveBeenCalled();
    });

    it('should handle null scheduledTime', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);
      mockSchedule.create.mockResolvedValue(fakeSchedule);

      await createSchedule(
        { deviceId: 1, name: 'Test', command: 'test' },
        1
      );

      expect(mockSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledTime: null,
        })
      );
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule fields', async () => {
      const existingSchedule = {
        ...fakeSchedule,
        update: jest.fn(),
      };
      mockSchedule.findByPk.mockResolvedValue(existingSchedule);

      await updateSchedule(1, {
        name: 'Updated Schedule',
        command: 'reboot',
        isActive: false,
      });

      expect(existingSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Schedule',
          command: 'reboot',
          isActive: false,
        })
      );
    });

    it('should throw NotFoundError when schedule does not exist', async () => {
      mockSchedule.findByPk.mockResolvedValue(null);

      await expect(updateSchedule(999, { name: 'test' })).rejects.toThrow(AppError);

      try {
        await updateSchedule(999, { name: 'test' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });

    it('should handle scheduledTime conversion', async () => {
      const existingSchedule = {
        ...fakeSchedule,
        update: jest.fn(),
      };
      mockSchedule.findByPk.mockResolvedValue(existingSchedule);

      await updateSchedule(1, {
        scheduledTime: '2024-06-15T10:00:00.000Z',
      });

      expect(existingSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledTime: new Date('2024-06-15T10:00:00.000Z'),
        })
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete schedule successfully', async () => {
      const destroyableSchedule = {
        ...fakeSchedule,
        destroy: jest.fn(),
      };
      mockSchedule.findByPk.mockResolvedValue(destroyableSchedule);

      await deleteSchedule(1);

      expect(destroyableSchedule.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when schedule does not exist', async () => {
      mockSchedule.findByPk.mockResolvedValue(null);

      await expect(deleteSchedule(999)).rejects.toThrow(AppError);

      try {
        await deleteSchedule(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('executeSchedule', () => {
    it('should execute schedule and send MQTT command', async () => {
      const scheduleWithDevice = {
        ...fakeSchedule,
        update: jest.fn(),
      };
      mockSchedule.findByPk.mockResolvedValue(scheduleWithDevice);
      mockDevice.findByPk.mockResolvedValue(fakeDevice);

      const result = await executeSchedule(1);

      expect(mockMqttClient.sendCommand).toHaveBeenCalledWith(
        'Sensor-01',
        expect.objectContaining({
          command: 'get_status',
          params: { key: 'value' },
          scheduleId: 1,
          timestamp: expect.any(String),
        })
      );
      expect(scheduleWithDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastRun: expect.any(Date),
        })
      );
      expect(result.message).toBe('Schedule executed on device Sensor-01');
    });

    it('should throw NotFoundError when schedule does not exist', async () => {
      mockSchedule.findByPk.mockResolvedValue(null);

      await expect(executeSchedule(999)).rejects.toThrow(AppError);

      try {
        await executeSchedule(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });

    it('should throw NotFoundError when device does not exist', async () => {
      mockSchedule.findByPk.mockResolvedValue(fakeSchedule);
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(executeSchedule(1)).rejects.toThrow(AppError);

      try {
        await executeSchedule(1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });
});
