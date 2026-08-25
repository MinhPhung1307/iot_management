import { Router } from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  executeSchedule,
} from '../controllers/scheduleController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdParamSchema,
  getSchedulesQuerySchema,
} from '../validators/schedule.validator';

const router = Router();
router.use(authenticate);

router.get('/', validate(getSchedulesQuerySchema), getSchedules);
router.get('/:id', validate(scheduleIdParamSchema), getScheduleById);
router.post('/', authorize('admin'), validate(createScheduleSchema), createSchedule);
router.put(
  '/:id',
  authorize('admin'),
  validate(updateScheduleSchema),
  updateSchedule
);
router.delete(
  '/:id',
  authorize('admin'),
  validate(scheduleIdParamSchema),
  deleteSchedule
);
router.post(
  '/:id/execute',
  authorize('admin'),
  validate(scheduleIdParamSchema),
  executeSchedule
);

export default router;
