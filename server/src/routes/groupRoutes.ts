import { Router } from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController';
import { authenticate } from '../middleware/auth';
import { abac } from '../middleware/abac';
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
router.post('/', abac('group', 'create'), validate(createGroupSchema), createGroup);
router.put(
  '/:id',
  abac('group', 'update'),
  validate(updateGroupSchema),
  updateGroup
);
router.delete(
  '/:id',
  abac('group', 'delete'),
  validate(groupIdParamSchema),
  deleteGroup
);

export default router;
