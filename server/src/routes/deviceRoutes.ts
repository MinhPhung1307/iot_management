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
import { authenticate } from '../middleware/auth';
import { abac } from '../middleware/abac';
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
router.post('/', abac('device', 'create'), validate(createDeviceSchema), createDevice);
router.put(
  '/:id',
  abac('device', 'update'),
  validate(updateDeviceSchema),
  updateDevice
);
router.delete(
  '/:id',
  abac('device', 'delete'),
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
  abac('device', 'execute'),
  validate(sendCommandSchema),
  sendCommand
);

export default router;
