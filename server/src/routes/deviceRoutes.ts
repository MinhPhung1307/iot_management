import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceData,
  getDeviceStats,
} from '../controllers/deviceController';
import { sendCommand } from '../controllers/commandController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', getDeviceStats);
router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/', authorize('admin'), createDevice);
router.put('/:id', authorize('admin'), updateDevice);
router.delete('/:id', authorize('admin'), deleteDevice);
router.get('/:id/data', getDeviceData);
router.post('/:id/command', authorize('admin'), sendCommand);

export default router;
