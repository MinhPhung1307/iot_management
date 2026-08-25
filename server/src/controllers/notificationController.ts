import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationService.getNotifications(
      req.user!.id,
      req.query as any
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.markAsRead(Number(req.params.id), req.user!.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.deleteNotification(
      Number(req.params.id),
      req.user!.id
    );
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
