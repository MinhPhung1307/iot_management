import CommandHistory from '../models/CommandHistory';
import Device from '../models/Device';
import { NotFoundError } from '../middleware/AppError';
import { mqttClient } from '../mqtt/mqttClient';
import { getCommandStrategy } from '../strategies/commandStrategies';

export const sendCommand = async (
  deviceId: number,
  data: { command: string; params?: Record<string, any> },
  userId: number
) => {
  const device = await Device.findByPk(deviceId);

  if (!device) {
    throw new NotFoundError('Device');
  }

  const { command, params } = data;

  const strategy = getCommandStrategy(command);
  await strategy.execute({ device, params });

  // Save command history (don't fail if table doesn't exist)
  try {
    await CommandHistory.create({
      deviceId: device.id,
      command,
      params,
      status: 'sent',
      sentBy: userId,
    });
  } catch (historyError) {
    console.log('Command history not saved:', historyError);
  }

  // Send command via MQTT
  mqttClient.sendCommand(device.name, {
    command,
    params,
    timestamp: new Date().toISOString(),
  });

  return {
    message: `Command sent to device ${device.name}`,
    command,
    params,
    device: {
      id: device.id,
      name: device.name,
      status: device.status,
      lastSeen: device.lastSeen,
    },
  };
};

export const getCommandHistory = async (
  deviceId: number,
  query: { limit?: string; offset?: string }
) => {
  const { limit = '50', offset = '0' } = query;

  const commands = await CommandHistory.findAll({
    where: { deviceId },
    include: [{ model: Device, as: 'device', attributes: ['name'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: Number(offset),
  });

  return { commands };
};
