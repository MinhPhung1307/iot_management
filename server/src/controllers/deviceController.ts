import { Response } from 'express';
import Device from '../models/Device';
import DeviceData from '../models/DeviceData';
import { AuthRequest } from '../types';
import { mqttClient } from '../mqtt/mqttClient';

export const getDevices = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, status, location, search, page = 1, limit = 10 } = req.query;

    const whereClause: any = {};

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (location) whereClause.location = location;
    if (search) {
      whereClause.name = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: devices } = await Device.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      devices,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching devices', error });
  }
};

export const getDeviceById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id, {
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
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    res.json({ device });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching device', error });
  }
};

export const createDevice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, type, location, parameters } = req.body;

    const device = await Device.create({
      name,
      type,
      location,
      parameters,
      status: 'offline',
    });

    res.status(201).json({
      message: 'Device created successfully',
      device,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating device', error });
  }
};

export const updateDevice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);

    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    const { name, type, location, status, parameters } = req.body;

    await device.update({
      name: name || device.name,
      type: type || device.type,
      location: location !== undefined ? location : device.location,
      status: status || device.status,
      parameters: parameters || device.parameters,
    });

    res.json({
      message: 'Device updated successfully',
      device,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating device', error });
  }
};

export const deleteDevice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);

    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    await device.destroy();

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting device', error });
  }
};

export const getDeviceData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    const whereClause: any = {
      deviceId: req.params.id,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp[require('sequelize').Op.gte] = new Date(startDate as string);
      if (endDate) whereClause.timestamp[require('sequelize').Op.lte] = new Date(endDate as string);
    }

    const data = await DeviceData.findAll({
      where: whereClause,
      limit: Number(limit),
      order: [['timestamp', 'DESC']],
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching device data', error });
  }
};

export const sendCommand = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);

    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    const { command, params } = req.body;

    mqttClient.sendCommand(device.name, {
      command,
      params,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: `Command sent to device ${device.name}`,
      command,
      params,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending command', error });
  }
};

export const getDeviceStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const totalDevices = await Device.count();
    const onlineDevices = await Device.count({ where: { status: 'online' } });
    const offlineDevices = await Device.count({ where: { status: 'offline' } });
    const warningDevices = await Device.count({ where: { status: 'warning' } });
    const errorDevices = await Device.count({ where: { status: 'error' } });

    const devicesByType = await Device.findAll({
      attributes: ['type', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['type'],
    });

    res.json({
      total: totalDevices,
      byStatus: {
        online: onlineDevices,
        offline: offlineDevices,
        warning: warningDevices,
        error: errorDevices,
      },
      byType: devicesByType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};
