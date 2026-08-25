import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as groupService from '../services/group.service';

export const getGroups = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await groupService.getGroups();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await groupService.getGroupById(Number(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await groupService.createGroup(req.body, req.user!.id);
    res.status(201).json({
      message: 'Group created successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await groupService.updateGroup(
      Number(req.params.id),
      req.body
    );
    res.json({
      message: 'Group updated successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await groupService.deleteGroup(Number(req.params.id));
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};
