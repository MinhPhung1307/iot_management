import Policy from '../../models/Policy';
import PolicyCondition from '../../models/PolicyCondition';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  togglePolicyActive,
} from '../../services/policy.service';
import { NotFoundError, BadRequestError, AppError } from '../../middleware/AppError';

jest.mock('../../models/Policy');
jest.mock('../../models/PolicyCondition');

const mockPolicy = Policy as jest.Mocked<typeof Policy>;
const mockPolicyCondition = PolicyCondition as jest.Mocked<typeof PolicyCondition>;

describe('policy.service', () => {
  const fakePolicy = {
    id: 1,
    name: 'Test Policy',
    description: 'Test description',
    effect: 'permit',
    priority: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Policy;

  const fakeCondition = {
    id: 1,
    policyId: 1,
    subjectAttr: 'role',
    resourceAttr: null,
    actionAttr: null,
    environmentAttr: null,
    operator: 'eq',
    value: '"admin"',
    createdAt: new Date(),
  } as PolicyCondition;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPolicies', () => {
    it('should return all policies with conditions', async () => {
      mockPolicy.findAll.mockResolvedValue([{ ...fakePolicy, conditions: [fakeCondition] } as any]);

      const result = await getPolicies();

      expect(mockPolicy.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getPolicyById', () => {
    it('should return policy when found', async () => {
      mockPolicy.findByPk.mockResolvedValue(fakePolicy);

      const result = await getPolicyById(1);

      expect(mockPolicy.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(fakePolicy);
    });

    it('should throw NotFoundError when not found', async () => {
      mockPolicy.findByPk.mockResolvedValue(null);

      await expect(getPolicyById(999)).rejects.toThrow(AppError);
    });
  });

  describe('createPolicy', () => {
    it('should create policy successfully', async () => {
      mockPolicy.findOne.mockResolvedValue(null);
      mockPolicy.create.mockResolvedValue(fakePolicy);
      mockPolicy.findByPk.mockResolvedValue(fakePolicy);

      const result = await createPolicy({
        name: 'Test Policy',
        description: 'Test description',
        effect: 'permit',
        priority: 10,
        conditions: [
          {
            subjectAttr: 'role',
            operator: 'eq',
            value: '"admin"',
          },
        ],
      });

      expect(mockPolicy.create).toHaveBeenCalled();
      expect(mockPolicyCondition.bulkCreate).toHaveBeenCalled();
    });

    it('should throw BadRequestError if name already exists', async () => {
      mockPolicy.findOne.mockResolvedValue(fakePolicy);

      await expect(
        createPolicy({
          name: 'Test Policy',
          effect: 'permit',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('updatePolicy', () => {
    it('should update policy successfully', async () => {
      const fakePolicyWithUpdate = {
        ...fakePolicy,
        update: jest.fn().mockResolvedValue(true),
      };
      mockPolicy.findByPk.mockResolvedValue(fakePolicyWithUpdate as any);
      mockPolicyCondition.destroy.mockResolvedValue(0);
      mockPolicyCondition.bulkCreate.mockResolvedValue([]);
      mockPolicy.findByPk.mockResolvedValue(fakePolicyWithUpdate as any);

      const result = await updatePolicy(1, {
        description: 'Updated description',
        effect: 'deny',
      });

      expect(fakePolicyWithUpdate.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when not found', async () => {
      mockPolicy.findByPk.mockResolvedValue(null);

      await expect(updatePolicy(999, { name: 'Test' })).rejects.toThrow(AppError);
    });

    it('should throw BadRequestError if new name already exists', async () => {
      const fakePolicyWithUpdate = {
        ...fakePolicy,
        update: jest.fn(),
      };
      mockPolicy.findByPk.mockResolvedValue(fakePolicyWithUpdate as any);
      mockPolicy.findOne.mockResolvedValue({ id: 2, name: 'Existing' } as Policy);

      await expect(
        updatePolicy(1, { name: 'Existing' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deletePolicy', () => {
    it('should delete policy successfully', async () => {
      const fakePolicyWithDestroy = {
        ...fakePolicy,
        destroy: jest.fn().mockResolvedValue(true),
      };
      mockPolicy.findByPk.mockResolvedValue(fakePolicyWithDestroy as any);
      mockPolicyCondition.destroy.mockResolvedValue(0);

      const result = await deletePolicy(1);

      expect(mockPolicyCondition.destroy).toHaveBeenCalled();
      expect(fakePolicyWithDestroy.destroy).toHaveBeenCalled();
      expect(result.message).toContain('deleted');
    });

    it('should throw NotFoundError when not found', async () => {
      mockPolicy.findByPk.mockResolvedValue(null);

      await expect(deletePolicy(999)).rejects.toThrow(AppError);
    });
  });

  describe('togglePolicyActive', () => {
    it('should toggle isActive', async () => {
      const fakePolicyWithUpdate = {
        ...fakePolicy,
        update: jest.fn().mockResolvedValue(true),
      };
      mockPolicy.findByPk.mockResolvedValue(fakePolicyWithUpdate as any);

      const result = await togglePolicyActive(1);

      expect(fakePolicyWithUpdate.update).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw NotFoundError when not found', async () => {
      mockPolicy.findByPk.mockResolvedValue(null);

      await expect(togglePolicyActive(999)).rejects.toThrow(AppError);
    });
  });
});
