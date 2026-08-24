import { Response } from 'express';
import CommandHistory from '../models/CommandHistory';
import Device from '../models/Device';
import { AuthRequest } from '../types';
import { mqttClient } from '../mqtt/mqttClient';
import { serverSocket } from '../websocket/socket';

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

    // Handle status-changing commands directly
    if (command === 'turn_on') {
      await device.update({
        status: 'online',
        lastSeen: new Date(),
      });
      serverSocket.emitDeviceUpdate(device.id, {
        id: device.id,
        name: device.name,
        status: 'online',
        lastSeen: new Date(),
      });
    } else if (command === 'turn_off') {
      await device.update({
        status: 'offline',
        lastSeen: new Date(),
      });
      serverSocket.emitDeviceUpdate(device.id, {
        id: device.id,
        name: device.name,
        status: 'offline',
        lastSeen: new Date(),
      });
    }

    // Try to save command history (don't fail if table doesn't exist)
    try {
      await CommandHistory.create({
        deviceId: device.id,
        command,
        params,
        status: 'sent',
        sentBy: req.user!.id,
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

    res.json({
      message: `Command sent to device ${device.name}`,
      command,
      params,
      device: {
        id: device.id,
        name: device.name,
        status: device.status,
        lastSeen: device.lastSeen,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending command', error });
  }
};

export const getCommandHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const commands = await CommandHistory.findAll({
      where: { deviceId: req.params.id },
      include: [{ model: Device, as: 'device', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({ commands });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching command history', error });
  }
};
