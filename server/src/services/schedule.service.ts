import Schedule from '../models/Schedule';
import Device from '../models/Device';
import { NotFoundError } from '../middleware/AppError';
import { mqttClient } from '../mqtt/mqttClient';

export const getSchedules = async (query: { deviceId?: string }) => {
  const { deviceId } = query;

  const whereClause: any = {};
  if (deviceId) whereClause.deviceId = deviceId;

  const schedules = await Schedule.findAll({
    where: whereClause,
    include: [
      { model: Device, as: 'device', attributes: ['id', 'name', 'type'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  return { schedules };
};

export const getScheduleById = async (id: number) => {
  const schedule = await Schedule.findByPk(id, {
    include: [
      {
        model: Device,
        as: 'device',
        attributes: ['id', 'name', 'type', 'status'],
      },
    ],
  });

  if (!schedule) {
    throw new NotFoundError('Schedule');
  }

  return { schedule };
};

export const createSchedule = async (
  data: {
    deviceId: number;
    name: string;
    command: string;
    params?: Record<string, any>;
    cronExpression?: string;
    scheduledTime?: string;
  },
  userId: number
) => {
  const device = await Device.findByPk(data.deviceId);
  if (!device) {
    throw new NotFoundError('Device');
  }

  const schedule = await Schedule.create({
    deviceId: data.deviceId,
    name: data.name,
    command: data.command,
    params: data.params,
    cronExpression: data.cronExpression,
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    createdBy: userId,
  });

  return { schedule };
};

export const updateSchedule = async (
  id: number,
  data: {
    name?: string;
    command?: string;
    params?: Record<string, any> | null;
    cronExpression?: string | null;
    scheduledTime?: string | null;
    isActive?: boolean;
  }
) => {
  const schedule = await Schedule.findByPk(id);

  if (!schedule) {
    throw new NotFoundError('Schedule');
  }

  await schedule.update({
    name: data.name,
    command: data.command,
    params: data.params,
    cronExpression: data.cronExpression,
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
    isActive: data.isActive,
  });

  return { schedule };
};

export const deleteSchedule = async (id: number) => {
  const schedule = await Schedule.findByPk(id);

  if (!schedule) {
    throw new NotFoundError('Schedule');
  }

  await schedule.destroy();
};

export const executeSchedule = async (id: number) => {
  const schedule = await Schedule.findByPk(id);

  if (!schedule) {
    throw new NotFoundError('Schedule');
  }

  const device = await Device.findByPk(schedule.deviceId);

  if (!device) {
    throw new NotFoundError('Device');
  }

  mqttClient.sendCommand(device.name, {
    command: schedule.command,
    params: schedule.params,
    scheduleId: schedule.id,
    timestamp: new Date().toISOString(),
  });

  await schedule.update({ lastRun: new Date() });

  return {
    message: `Schedule executed on device ${device.name}`,
    schedule,
  };
};
