import { AccessRequest, SubjectAttributes, ResourceAttributes, EnvironmentAttributes } from '../value-objects/AccessRequest';
import { AccessDecision } from '../value-objects/AccessDecision';

export interface PolicyCondition {
  id: number;
  policyId: number;
  subjectAttr?: string | null;
  resourceAttr?: string | null;
  actionAttr?: string | null;
  environmentAttr?: string | null;
  operator: string;
  value: string;
}

export interface Policy {
  id: number;
  name: string;
  description?: string | null;
  effect: 'permit' | 'deny';
  priority: number;
  isActive: boolean;
  conditions: PolicyCondition[];
}

export interface IPolicyRepository {
  findActive(): Promise<Policy[]>;
}

export class PolicyEngine {
  constructor(private policyRepository: IPolicyRepository) {}

  async evaluate(request: AccessRequest): Promise<AccessDecision> {
    const policies = await this.policyRepository.findActive();

    // Sort by priority descending (higher priority evaluated first)
    const sortedPolicies = [...policies].sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      if (this.matchesPolicy(request, policy)) {
        return {
          allowed: policy.effect === 'permit',
          reason: `Matched policy: ${policy.name}`,
          policyId: policy.id,
          policyName: policy.name,
        };
      }
    }

    // Default deny if no policy matches
    return {
      allowed: false,
      reason: 'No matching policy found - default deny',
    };
  }

  private matchesPolicy(request: AccessRequest, policy: Policy): boolean {
    if (!policy.conditions || policy.conditions.length === 0) {
      return false;
    }

    // ALL conditions must match for the policy to apply (AND logic)
    return policy.conditions.every(condition =>
      this.evaluateCondition(request, condition)
    );
  }

  private evaluateCondition(request: AccessRequest, condition: PolicyCondition): boolean {
    let actualValue: any = undefined;
    let expectedValue: any;

    // Determine which attribute to check
    if (condition.subjectAttr) {
      actualValue = this.getSubjectAttribute(request.subject, condition.subjectAttr);
    } else if (condition.resourceAttr) {
      actualValue = this.getResourceAttribute(request.resource, condition.resourceAttr);
    } else if (condition.actionAttr) {
      actualValue = request.action;
    } else if (condition.environmentAttr) {
      actualValue = this.getEnvironmentAttribute(request.environment, condition.environmentAttr);
    }

    // Parse expected value from condition
    try {
      expectedValue = JSON.parse(condition.value);
    } catch {
      // If not valid JSON, treat as string
      expectedValue = condition.value;
    }

    // Evaluate based on operator
    return this.compareValues(actualValue, expectedValue, condition.operator);
  }

  private getSubjectAttribute(subject: SubjectAttributes, attr: string): any {
    switch (attr) {
      case 'userId': return subject.userId;
      case 'role': return subject.role;
      case 'department': return subject.department;
      case 'clearanceLevel': return subject.clearanceLevel;
      default: return undefined;
    }
  }

  private getResourceAttribute(resource: ResourceAttributes, attr: string): any {
    switch (attr) {
      case 'id': return resource.id;
      case 'type': return resource.type;
      case 'ownerId': return resource.ownerId;
      case 'groupId': return resource.groupId;
      case 'sensitivity': return resource.sensitivity;
      default: return undefined;
    }
  }

  private getEnvironmentAttribute(environment: EnvironmentAttributes, attr: string): any {
    switch (attr) {
      case 'timestamp': return environment.timestamp;
      case 'ipAddress': return environment.ipAddress;
      case 'isBusinessHours': return environment.isBusinessHours;
      default: return undefined;
    }
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    if (actual === undefined) {
      // If attribute doesn't exist, condition fails
      return false;
    }

    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'gt':
        return actual > expected;
      case 'gte':
        return actual >= expected;
      case 'lt':
        return actual < expected;
      case 'lte':
        return actual <= expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'starts_with':
        return typeof actual === 'string' && actual.startsWith(expected);
      case 'ends_with':
        return typeof actual === 'string' && actual.endsWith(expected);
      default:
        return false;
    }
  }
}
