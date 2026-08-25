import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as deviceService from '../services/device.service';

export const getDevices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.getDevices(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDeviceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.getDeviceById(Number(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.createDevice(req.body);
    res.status(201).json({
      message: 'Device created successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.updateDevice(
      Number(req.params.id),
      req.body
    );
    res.json({
      message: 'Device updated successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await deviceService.deleteDevice(Number(req.params.id));
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDeviceData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.getDeviceData(
      Number(req.params.id),
      req.query as any
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDeviceStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deviceService.getDeviceStats();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
