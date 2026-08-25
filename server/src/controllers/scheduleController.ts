import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as scheduleService from '../services/schedule.service';

export const getSchedules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await scheduleService.getSchedules(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getScheduleById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await scheduleService.getScheduleById(Number(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await scheduleService.createSchedule(req.body, req.user!.id);
    res.status(201).json({
      message: 'Schedule created successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await scheduleService.updateSchedule(
      Number(req.params.id),
      req.body
    );
    res.json({
      message: 'Schedule updated successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await scheduleService.deleteSchedule(Number(req.params.id));
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const executeSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await scheduleService.executeSchedule(Number(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};
