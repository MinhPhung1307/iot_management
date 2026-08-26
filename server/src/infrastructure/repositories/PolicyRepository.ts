import { Policy, PolicyCondition } from '../../models';
import { Policy as PolicyDomain, IPolicyRepository } from '../../domain/policies/PolicyEngine';

export class PolicyRepository implements IPolicyRepository {
  async findActive(): Promise<PolicyDomain[]> {
    const policies = await Policy.findAll({
      where: { isActive: true },
      include: [
        {
          model: PolicyCondition,
          as: 'conditions',
          attributes: ['id', 'policyId', 'subjectAttr', 'resourceAttr', 'actionAttr', 'environmentAttr', 'operator', 'value'],
        },
      ],
      order: [['priority', 'DESC']],
    });

    return policies.map(p => this.toDomain(p));
  }

  private toDomain(model: Policy): PolicyDomain {
    const conditions = (model as any).conditions || [];
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      effect: model.effect as 'permit' | 'deny',
      priority: model.priority,
      isActive: model.isActive,
      conditions: conditions.map((c: any) => ({
        id: c.id,
        policyId: c.policyId,
        subjectAttr: c.subjectAttr,
        resourceAttr: c.resourceAttr,
        actionAttr: c.actionAttr,
        environmentAttr: c.environmentAttr,
        operator: c.operator,
        value: c.value,
      })),
    };
  }
}
