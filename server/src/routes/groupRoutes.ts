import { Router } from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/', authorize('admin'), createGroup);
router.put('/:id', authorize('admin'), updateGroup);
router.delete('/:id', authorize('admin'), deleteGroup);

export default router;
