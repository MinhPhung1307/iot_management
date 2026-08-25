import Notification from '../models/Notification';
import { NotFoundError } from '../middleware/AppError';

export const getNotifications = async (
  userId: number,
  query: { isRead?: string; limit?: string; offset?: string }
) => {
  const { isRead, limit = '20', offset = '0' } = query;

  const whereClause: any = { userId };
  if (isRead !== undefined) {
    whereClause.isRead = isRead === 'true';
  }

  const notifications = await Notification.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: Number(offset),
  });

  const unreadCount = await Notification.count({
    where: { userId, isRead: false },
  });

  return {
    notifications: notifications.rows,
    total: notifications.count,
    unreadCount,
  };
};

export const markAsRead = async (id: number, userId: number) => {
  const notification = await Notification.findOne({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  await notification.update({ isRead: true });
};

export const markAllAsRead = async (userId: number) => {
  await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );
};

export const deleteNotification = async (id: number, userId: number) => {
  const notification = await Notification.findOne({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  await notification.destroy();
};
