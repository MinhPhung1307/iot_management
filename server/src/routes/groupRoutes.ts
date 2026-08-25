import { Router } from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdParamSchema,
} from '../validators/group.validator';

const router = Router();
router.use(authenticate);

router.get('/', getGroups);
router.get('/:id', validate(groupIdParamSchema), getGroupById);
router.post('/', authorize('admin'), validate(createGroupSchema), createGroup);
router.put(
  '/:id',
  authorize('admin'),
  validate(updateGroupSchema),
  updateGroup
);
router.delete(
  '/:id',
  authorize('admin'),
  validate(groupIdParamSchema),
  deleteGroup
);

export default router;
