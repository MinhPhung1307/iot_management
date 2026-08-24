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

const router = Router();
router.use(authenticate);

router.get('/', getSchedules);
router.get('/:id', getScheduleById);
router.post('/', authorize('admin'), createSchedule);
router.put('/:id', authorize('admin'), updateSchedule);
router.delete('/:id', authorize('admin'), deleteSchedule);
router.post('/:id/execute', authorize('admin'), executeSchedule);

export default router;
