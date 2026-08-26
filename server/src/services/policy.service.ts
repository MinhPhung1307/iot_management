import Policy from '../models/Policy';
import PolicyCondition from '../models/PolicyCondition';
import { NotFoundError, BadRequestError } from '../middleware/AppError';

// =====================================================
// Types
// =====================================================

export interface PolicyConditionData {
  subjectAttr?: string;
  resourceAttr?: string;
  actionAttr?: string;
  environmentAttr?: string;
  operator: string;
  value: string;
}

export interface CreatePolicyData {
  name: string;
  description?: string;
  effect: 'permit' | 'deny';
  priority?: number;
  conditions?: PolicyConditionData[];
}

export interface UpdatePolicyData {
  name?: string;
  description?: string;
  effect?: 'permit' | 'deny';
  priority?: number;
  isActive?: boolean;
  conditions?: PolicyConditionData[];
}

// =====================================================
// Service Functions
// =====================================================

export const getPolicies = async () => {
  const policies = await Policy.findAll({
    include: [
      {
        model: PolicyCondition,
        as: 'conditions',
      },
    ],
    order: [['priority', 'DESC']],
  });

  return policies;
};

export const getPolicyById = async (id: number) => {
  const policy = await Policy.findByPk(id, {
    include: [
      {
        model: PolicyCondition,
        as: 'conditions',
      },
    ],
  });

  if (!policy) {
    throw new NotFoundError('Policy');
  }

  return policy;
};

export const createPolicy = async (data: CreatePolicyData) => {
  // Check unique name
  const existing = await Policy.findOne({ where: { name: data.name } });
  if (existing) {
    throw new BadRequestError('Policy name already exists');
  }

  // Create policy
  const policy = await Policy.create({
    name: data.name,
    description: data.description,
    effect: data.effect,
    priority: data.priority || 0,
    isActive: true,
  });

  // Create conditions if provided
  if (data.conditions && data.conditions.length > 0) {
    const conditions = data.conditions.map(cond => ({
      ...cond,
      policyId: policy.id,
    }));
    await PolicyCondition.bulkCreate(conditions);
  }

  // Return with conditions
  return getPolicyById(policy.id);
};

export const updatePolicy = async (id: number, data: UpdatePolicyData) => {
  const policy = await Policy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy');
  }

  // Check unique name if changing
  if (data.name && data.name !== policy.name) {
    const existing = await Policy.findOne({ where: { name: data.name } });
    if (existing) {
      throw new BadRequestError('Policy name already exists');
    }
  }

  // Update policy fields
  await policy.update({
    name: data.name || policy.name,
    description: data.description !== undefined ? data.description : policy.description,
    effect: data.effect || policy.effect,
    priority: data.priority !== undefined ? data.priority : policy.priority,
    isActive: data.isActive !== undefined ? data.isActive : policy.isActive,
  });

  // Update conditions if provided (replace all)
  if (data.conditions !== undefined) {
    // Delete existing conditions
    await PolicyCondition.destroy({ where: { policyId: id } });

    // Create new conditions
    if (data.conditions.length > 0) {
      const conditions = data.conditions.map(cond => ({
        ...cond,
        policyId: id,
      }));
      await PolicyCondition.bulkCreate(conditions);
    }
  }

  return getPolicyById(id);
};

export const deletePolicy = async (id: number) => {
  const policy = await Policy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy');
  }

  // Delete conditions first (cascade should handle this, but be explicit)
  await PolicyCondition.destroy({ where: { policyId: id } });
  await policy.destroy();

  return { message: 'Policy deleted successfully' };
};

export const togglePolicyActive = async (id: number) => {
  const policy = await Policy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy');
  }

  await policy.update({ isActive: !policy.isActive });
  return getPolicyById(id);
};
