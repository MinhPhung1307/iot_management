import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../validators/notification.validator';

const router = Router();
router.use(authenticate);

router.get('/', validate(getNotificationsQuerySchema), getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', validate(notificationIdParamSchema), markAsRead);
router.delete(
  '/:id',
  validate(notificationIdParamSchema),
  deleteNotification
);

export default router;
