import { Op } from 'sequelize';
import Device from '../models/Device';
import DeviceData from '../models/DeviceData';
import { NotFoundError } from '../middleware/AppError';
import { DeviceStatus } from '../types';

export const getDevices = async (query: {
  type?: string;
  status?: string;
  location?: string;
  search?: string;
  page?: string;
  limit?: string;
}) => {
  const { type, status, location, search, page = '1', limit = '10' } = query;

  const whereClause: any = {};

  if (type) whereClause.type = type;
  if (status) whereClause.status = status;
  if (location) whereClause.location = location;
  if (search) {
    whereClause.name = { [Op.iLike]: `%${search}%` };
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: devices } = await Device.findAndCountAll({
    where: whereClause,
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    devices,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    },
  };
};

export const getDeviceById = async (id: number) => {
  const device = await Device.findByPk(id, {
    include: [
      {
        model: DeviceData,
        as: 'dataPoints',
        limit: 100,
        order: [['timestamp', 'DESC']],
      },
    ],
  });

  if (!device) {
    throw new NotFoundError('Device');
  }

  return { device };
};

export const createDevice = async (data: {
  name: string;
  type: string;
  location?: string;
  parameters?: Record<string, any>;
}) => {
  const device = await Device.create({
    name: data.name,
    type: data.type,
    location: data.location,
    parameters: data.parameters,
    status: DeviceStatus.OFFLINE,
  });

  return { device };
};

export const updateDevice = async (
  id: number,
  data: {
    name?: string;
    type?: string;
    location?: string | null;
    status?: string;
    parameters?: Record<string, any>;
  }
) => {
  const device = await Device.findByPk(id);

  if (!device) {
    throw new NotFoundError('Device');
  }

  await device.update({
    name: data.name || device.name,
    type: data.type || device.type,
    location: data.location !== undefined ? data.location : device.location,
    status: data.status || device.status,
    parameters: data.parameters || device.parameters,
  });

  return { device };
};

export const deleteDevice = async (id: number) => {
  const device = await Device.findByPk(id);

  if (!device) {
    throw new NotFoundError('Device');
  }

  await device.destroy();
};

export const getDeviceData = async (
  deviceId: number,
  query: {
    startDate?: string;
    endDate?: string;
    limit?: string;
  }
) => {
  const { startDate, endDate, limit = '100' } = query;

  const whereClause: any = { deviceId };

  if (startDate || endDate) {
    whereClause.timestamp = {};
    if (startDate) whereClause.timestamp[Op.gte] = new Date(startDate);
    if (endDate) whereClause.timestamp[Op.lte] = new Date(endDate);
  }

  const data = await DeviceData.findAll({
    where: whereClause,
    limit: Number(limit),
    order: [['timestamp', 'DESC']],
  });

  return { data };
};

export const getDeviceStats = async () => {
  const totalDevices = await Device.count();
  const onlineDevices = await Device.count({ where: { status: DeviceStatus.ONLINE } });
  const offlineDevices = await Device.count({ where: { status: DeviceStatus.OFFLINE } });
  const warningDevices = await Device.count({ where: { status: DeviceStatus.WARNING } });
  const errorDevices = await Device.count({ where: { status: DeviceStatus.ERROR } });

  const devicesByType = await Device.findAll({
    attributes: ['type', [Device.sequelize!.fn('COUNT', 'id'), 'count']],
    group: ['type'],
  });

  return {
    total: totalDevices,
    byStatus: {
      online: onlineDevices,
      offline: offlineDevices,
      warning: warningDevices,
      error: errorDevices,
    },
    byType: devicesByType,
  };
};
