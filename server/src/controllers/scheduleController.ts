import { Response } from 'express';
import Schedule from '../models/Schedule';
import Device from '../models/Device';
import { AuthRequest } from '../types';
import { mqttClient } from '../mqtt/mqttClient';

export const getSchedules = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { deviceId } = req.query;

    const whereClause: any = {};
    if (deviceId) whereClause.deviceId = deviceId;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [{ model: Device, as: 'device', attributes: ['id', 'name', 'type'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ schedules });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error });
  }
};

export const getScheduleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schedule = await Schedule.findByPk(req.params.id, {
      include: [{ model: Device, as: 'device', attributes: ['id', 'name', 'type', 'status'] }],
    });

    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }

    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
};

export const createSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { deviceId, name, command, params, cronExpression, scheduledTime } = req.body;

    const device = await Device.findByPk(deviceId);
    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    const schedule = await Schedule.create({
      deviceId,
      name,
      command,
      params,
      cronExpression,
      scheduledTime,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error });
  }
};

export const updateSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }

    const { name, command, params, cronExpression, scheduledTime, isActive } = req.body;

    await schedule.update({
      name,
      command,
      params,
      cronExpression,
      scheduledTime,
      isActive,
    });

    res.json({
      message: 'Schedule updated successfully',
      schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error });
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }

    await schedule.destroy();

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule', error });
  }
};

export const executeSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }

    const device = await Device.findByPk(schedule.deviceId);

    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    mqttClient.sendCommand(device.name, {
      command: schedule.command,
      params: schedule.params,
      scheduleId: schedule.id,
      timestamp: new Date().toISOString(),
    });

    await schedule.update({ lastRun: new Date() });

    res.json({
      message: `Schedule executed on device ${device.name}`,
      schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error executing schedule', error });
  }
};
