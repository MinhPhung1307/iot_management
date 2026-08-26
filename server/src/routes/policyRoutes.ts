import { Router } from 'express';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  togglePolicyActive,
} from '../controllers/policyController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPolicySchema,
  updatePolicySchema,
  policyIdParamSchema,
} from '../validators/policy.validator';

const router = Router();
router.use(authenticate);

router.get('/', getPolicies);
router.get('/:id', validate(policyIdParamSchema), getPolicyById);
router.post('/', authorize('admin'), validate(createPolicySchema), createPolicy);
router.put(
  '/:id',
  authorize('admin'),
  validate(updatePolicySchema),
  updatePolicy
);
router.delete(
  '/:id',
  authorize('admin'),
  validate(policyIdParamSchema),
  deletePolicy
);
router.patch(
  '/:id/toggle',
  authorize('admin'),
  validate(policyIdParamSchema),
  togglePolicyActive
);

export default router;
