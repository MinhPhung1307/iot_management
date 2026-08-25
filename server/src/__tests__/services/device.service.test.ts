import { Op } from 'sequelize';
import { AppError } from '../../middleware/AppError';

jest.mock('../../models/Device', () => {
  const mockModel: any = {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    sequelize: { fn: jest.fn().mockReturnValue('COUNT') },
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('../../models/DeviceData', () => {
  const mockModel: any = {
    findAll: jest.fn(),
    belongsTo: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

import Device from '../../models/Device';
import DeviceData from '../../models/DeviceData';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceData,
  getDeviceStats,
} from '../../services/device.service';

const mockDevice = Device as any;
const mockDeviceData = DeviceData as any;

describe('device.service', () => {
  const fakeDevice = {
    id: 1,
    name: 'Sensor-01',
    type: 'sensor',
    location: 'Room A',
    status: 'online',
    lastSeen: new Date(),
    parameters: { unit: 'celsius' },
    createdAt: new Date(),
    updatedAt: new Date(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDevices', () => {
    it('should return devices with default pagination', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [fakeDevice],
      });

      const result = await getDevices({});

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          order: [['createdAt', 'DESC']],
        })
      );
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by type', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getDevices({ type: 'sensor' });

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'sensor' },
        })
      );
    });

    it('should filter by status', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getDevices({ status: 'offline' });

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'offline' },
        })
      );
    });

    it('should filter by location', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getDevices({ location: 'Room B' });

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { location: 'Room B' },
        })
      );
    });

    it('should search by name with Op.iLike', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await getDevices({ search: 'sensor' });

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: { [Op.iLike]: '%sensor%' },
          },
        })
      );
    });

    it('should apply custom pagination', async () => {
      mockDevice.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });

      const result = await getDevices({ page: '2', limit: '5' });

      expect(mockDevice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
        })
      );
      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 5,
        totalPages: 5,
      });
    });
  });

  describe('getDeviceById', () => {
    it('should return device with dataPoints', async () => {
      mockDevice.findByPk.mockResolvedValue(fakeDevice);

      const result = await getDeviceById(1);

      expect(mockDevice.findByPk).toHaveBeenCalledWith(1, {
        include: [
          expect.objectContaining({
            model: mockDeviceData,
            as: 'dataPoints',
            limit: 100,
          }),
        ],
      });
      expect(result.device).toBe(fakeDevice);
    });

    it('should throw NotFoundError when device does not exist', async () => {
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(getDeviceById(999)).rejects.toThrow(AppError);

      try {
        await getDeviceById(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('Device not found');
      }
    });
  });

  describe('createDevice', () => {
    it('should create device with status offline', async () => {
      mockDevice.create.mockResolvedValue(fakeDevice);

      const result = await createDevice({
        name: 'Sensor-01',
        type: 'sensor',
        location: 'Room A',
        parameters: { unit: 'celsius' },
      });

      expect(mockDevice.create).toHaveBeenCalledWith({
        name: 'Sensor-01',
        type: 'sensor',
        location: 'Room A',
        parameters: { unit: 'celsius' },
        status: 'offline',
      });
      expect(result.device).toBe(fakeDevice);
    });

    it('should create device without optional fields', async () => {
      mockDevice.create.mockResolvedValue(fakeDevice);

      await createDevice({
        name: 'Sensor-02',
        type: 'actuator',
      });

      expect(mockDevice.create).toHaveBeenCalledWith({
        name: 'Sensor-02',
        type: 'actuator',
        location: undefined,
        parameters: undefined,
        status: 'offline',
      });
    });
  });

  describe('updateDevice', () => {
    it('should update device fields', async () => {
      const existingDevice = {
        ...fakeDevice,
        update: jest.fn(),
      };
      mockDevice.findByPk.mockResolvedValue(existingDevice);

      await updateDevice(1, {
        name: 'Updated Sensor',
        status: 'warning',
      });

      expect(existingDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Sensor',
          status: 'warning',
        })
      );
    });

    it('should preserve existing values when fields not provided', async () => {
      const existingDevice = {
        ...fakeDevice,
        update: jest.fn(),
      };
      mockDevice.findByPk.mockResolvedValue(existingDevice);

      await updateDevice(1, {});

      expect(existingDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: fakeDevice.name,
          type: fakeDevice.type,
          status: fakeDevice.status,
        })
      );
    });

    it('should throw NotFoundError when device does not exist', async () => {
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(updateDevice(999, { name: 'test' })).rejects.toThrow(AppError);

      try {
        await updateDevice(999, { name: 'test' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });

    it('should allow setting location to null', async () => {
      const existingDevice = {
        ...fakeDevice,
        update: jest.fn(),
      };
      mockDevice.findByPk.mockResolvedValue(existingDevice);

      await updateDevice(1, { location: null });

      expect(existingDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          location: null,
        })
      );
    });
  });

  describe('deleteDevice', () => {
    it('should delete device successfully', async () => {
      const destroyableDevice = {
        ...fakeDevice,
        destroy: jest.fn(),
      };
      mockDevice.findByPk.mockResolvedValue(destroyableDevice);

      await deleteDevice(1);

      expect(destroyableDevice.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when device does not exist', async () => {
      mockDevice.findByPk.mockResolvedValue(null);

      await expect(deleteDevice(999)).rejects.toThrow(AppError);

      try {
        await deleteDevice(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('getDeviceData', () => {
    it('should return data for a device', async () => {
      const fakeData = [{ id: 1, deviceId: 1, timestamp: new Date() }];
      mockDeviceData.findAll.mockResolvedValue(fakeData);

      const result = await getDeviceData(1, {});

      expect(mockDeviceData.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deviceId: 1 },
          limit: 100,
          order: [['timestamp', 'DESC']],
        })
      );
      expect(result.data).toBe(fakeData);
    });

    it('should filter by startDate', async () => {
      mockDeviceData.findAll.mockResolvedValue([]);

      await getDeviceData(1, { startDate: '2024-01-01T00:00:00.000Z' });

      expect(mockDeviceData.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deviceId: 1,
            timestamp: expect.objectContaining({
              [Op.gte]: new Date('2024-01-01T00:00:00.000Z'),
            }),
          }),
        })
      );
    });

    it('should filter by endDate', async () => {
      mockDeviceData.findAll.mockResolvedValue([]);

      await getDeviceData(1, { endDate: '2024-12-31T23:59:59.000Z' });

      expect(mockDeviceData.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deviceId: 1,
            timestamp: expect.objectContaining({
              [Op.lte]: new Date('2024-12-31T23:59:59.000Z'),
            }),
          }),
        })
      );
    });

    it('should apply custom limit', async () => {
      mockDeviceData.findAll.mockResolvedValue([]);

      await getDeviceData(1, { limit: '50' });

      expect(mockDeviceData.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 })
      );
    });
  });

  describe('getDeviceStats', () => {
    it('should return device statistics', async () => {
      mockDevice.count
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(5)    // online
        .mockResolvedValueOnce(3)    // offline
        .mockResolvedValueOnce(1)    // warning
        .mockResolvedValueOnce(1);   // error

      mockDevice.findAll.mockResolvedValue([
        { type: 'sensor', count: 6 },
        { type: 'actuator', count: 4 },
      ]);

      const result = await getDeviceStats();

      expect(result).toEqual({
        total: 10,
        byStatus: {
          online: 5,
          offline: 3,
          warning: 1,
          error: 1,
        },
        byType: expect.any(Array),
      });
    });
  });
});
