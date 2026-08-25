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
import { validate } from '../middleware/validate';
import {
  createDeviceSchema,
  updateDeviceSchema,
  getDevicesQuerySchema,
  deviceIdParamSchema,
  getDeviceDataQuerySchema,
} from '../validators/device.validator';
import { sendCommandSchema } from '../validators/command.validator';

const router = Router();
router.use(authenticate);

router.get('/stats', getDeviceStats);
router.get('/', validate(getDevicesQuerySchema), getDevices);
router.get('/:id', validate(deviceIdParamSchema), getDeviceById);
router.post('/', authorize('admin'), validate(createDeviceSchema), createDevice);
router.put(
  '/:id',
  authorize('admin'),
  validate(updateDeviceSchema),
  updateDevice
);
router.delete(
  '/:id',
  authorize('admin'),
  validate(deviceIdParamSchema),
  deleteDevice
);
router.get(
  '/:id/data',
  validate(getDeviceDataQuerySchema),
  getDeviceData
);
router.post(
  '/:id/command',
  authorize('admin'),
  validate(sendCommandSchema),
  sendCommand
);

export default router;
