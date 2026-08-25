import { AppError } from '../../middleware/AppError';

jest.mock('../../models/Notification', () => {
  const mockModel: any = {
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

import Notification from '../../models/Notification';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notification.service';

const mockNotification = Notification as any;

describe('notification.service', () => {
  const fakeNotification = {
    id: 1,
    userId: 1,
    title: 'Device Alert',
    message: 'Temperature too high',
    type: 'warning',
    isRead: false,
    data: { temperature: 85 },
    createdAt: new Date(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return notifications with default pagination', async () => {
      mockNotification.findAndCountAll.mockResolvedValue({
        rows: [fakeNotification],
        count: 1,
      });
      mockNotification.count.mockResolvedValue(1);

      const result = await getNotifications(1, {});

      expect(mockNotification.findAndCountAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: [['createdAt', 'DESC']],
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual({
        notifications: [fakeNotification],
        total: 1,
        unreadCount: 1,
      });
    });

    it('should filter by isRead=true', async () => {
      mockNotification.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });
      mockNotification.count.mockResolvedValue(5);

      await getNotifications(1, { isRead: 'true' });

      expect(mockNotification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, isRead: true },
        })
      );
    });

    it('should filter by isRead=false', async () => {
      mockNotification.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });
      mockNotification.count.mockResolvedValue(5);

      await getNotifications(1, { isRead: 'false' });

      expect(mockNotification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, isRead: false },
        })
      );
    });

    it('should apply custom pagination', async () => {
      mockNotification.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });
      mockNotification.count.mockResolvedValue(0);

      await getNotifications(1, { limit: '10', offset: '20' });

      expect(mockNotification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );
    });

    it('should always count unread notifications', async () => {
      mockNotification.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });
      mockNotification.count.mockResolvedValue(3);

      await getNotifications(1, {});

      expect(mockNotification.count).toHaveBeenCalledWith({
        where: { userId: 1, isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notif = { ...fakeNotification, update: jest.fn() };
      mockNotification.findOne.mockResolvedValue(notif);

      await markAsRead(1, 1);

      expect(mockNotification.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(notif.update).toHaveBeenCalledWith({ isRead: true });
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      mockNotification.findOne.mockResolvedValue(null);

      await expect(markAsRead(999, 1)).rejects.toThrow(AppError);

      try {
        await markAsRead(999, 1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('Notification not found');
      }
    });

    it('should only find notification belonging to user', async () => {
      mockNotification.findOne.mockResolvedValue(null);

      await expect(markAsRead(1, 2)).rejects.toThrow(AppError);

      expect(mockNotification.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 2 },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockNotification.update.mockResolvedValue([5]);

      await markAllAsRead(1);

      expect(mockNotification.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { userId: 1, isRead: false } }
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const deletableNotif = { ...fakeNotification, destroy: jest.fn() };
      mockNotification.findOne.mockResolvedValue(deletableNotif);

      await deleteNotification(1, 1);

      expect(mockNotification.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(deletableNotif.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      mockNotification.findOne.mockResolvedValue(null);

      await expect(deleteNotification(999, 1)).rejects.toThrow(AppError);

      try {
        await deleteNotification(999, 1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });

    it('should only delete notification belonging to user', async () => {
      mockNotification.findOne.mockResolvedValue(null);

      await expect(deleteNotification(1, 2)).rejects.toThrow(AppError);

      expect(mockNotification.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 2 },
      });
    });
  });
});
