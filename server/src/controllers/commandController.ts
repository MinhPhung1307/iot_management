import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as commandService from '../services/command.service';

export const sendCommand = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await commandService.sendCommand(
      Number(req.params.id),
      req.body,
      req.user!.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCommandHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await commandService.getCommandHistory(
      Number(req.params.id),
      req.query as any
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
