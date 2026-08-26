import { Router } from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  executeSchedule,
} from '../controllers/scheduleController';
import { authenticate } from '../middleware/auth';
import { abac } from '../middleware/abac';
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
router.post('/', abac('schedule', 'create'), validate(createScheduleSchema), createSchedule);
router.put(
  '/:id',
  abac('schedule', 'update'),
  validate(updateScheduleSchema),
  updateSchedule
);
router.delete(
  '/:id',
  abac('schedule', 'delete'),
  validate(scheduleIdParamSchema),
  deleteSchedule
);
router.post(
  '/:id/execute',
  abac('schedule', 'execute'),
  validate(scheduleIdParamSchema),
  executeSchedule
);

export default router;
