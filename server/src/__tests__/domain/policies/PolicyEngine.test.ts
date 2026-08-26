import { PolicyEngine, Policy, IPolicyRepository } from '../../../domain/policies/PolicyEngine';
import { AccessRequest } from '../../../domain/value-objects/AccessRequest';

describe('PolicyEngine', () => {
  let policyEngine: PolicyEngine;
  let mockPolicyRepository: jest.Mocked<IPolicyRepository>;

  beforeEach(() => {
    mockPolicyRepository = {
      findActive: jest.fn(),
    };
    policyEngine = new PolicyEngine(mockPolicyRepository);
  });

  const createBaseRequest = (overrides: Partial<AccessRequest> = {}): AccessRequest => ({
    subject: {
      userId: 1,
      role: 'viewer',
      clearanceLevel: 1,
    },
    resource: {
      type: 'device',
      id: 1,
    },
    action: 'read',
    environment: {
      timestamp: new Date('2024-01-15T10:00:00'), // Monday 10 AM
      ipAddress: '192.168.1.1',
      isBusinessHours: true,
    },
    ...overrides,
  });

  describe('evaluate', () => {
    it('should deny when no policies exist', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([]);

      const decision = await policyEngine.evaluate(createBaseRequest());

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('No matching policy');
    });

    it('should deny when no policy matches', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Admin Only',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'role',
              operator: 'eq',
              value: '"admin"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(
        createBaseRequest({ subject: { userId: 1, role: 'user', clearanceLevel: 1 } })
      );

      expect(decision.allowed).toBe(false);
    });

    it('should permit when policy matches', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Allow Read',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              actionAttr: 'action',
              operator: 'eq',
              value: '"read"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toContain('Allow Read');
      expect(decision.policyId).toBe(1);
    });

    it('should evaluate higher priority first', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Low Priority Permit',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              actionAttr: 'action',
              operator: 'eq',
              value: '"read"',
            },
          ],
        },
        {
          id: 2,
          name: 'High Priority Deny',
          effect: 'deny',
          priority: 100,
          isActive: true,
          conditions: [
            {
              id: 2,
              policyId: 2,
              subjectAttr: 'role',
              operator: 'eq',
              value: '"viewer"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());

      expect(decision.allowed).toBe(false);
      expect(decision.policyName).toBe('High Priority Deny');
    });
  });

  describe('operators', () => {
    it('should handle eq operator', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'role',
              operator: 'eq',
              value: '"viewer"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(true);
    });

    it('should handle neq operator', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'role',
              operator: 'neq',
              value: '"admin"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(true);
    });

    it('should handle in operator', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'role',
              operator: 'in',
              value: '["viewer", "user"]',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(true);
    });

    it('should handle gt operator', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'clearanceLevel',
              operator: 'gt',
              value: '0',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(true);
    });

    it('should handle contains operator', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              environmentAttr: 'ipAddress',
              operator: 'contains',
              value: '"192.168"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(true);
    });
  });

  describe('multiple conditions', () => {
    it('should require ALL conditions to match (AND logic)', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'role',
              operator: 'eq',
              value: '"viewer"',
            },
            {
              id: 2,
              policyId: 1,
              environmentAttr: 'isBusinessHours',
              operator: 'eq',
              value: 'true',
            },
          ],
        },
      ]);

      // Both conditions match
      const decision1 = await policyEngine.evaluate(createBaseRequest());
      expect(decision1.allowed).toBe(true);

      // Second condition fails
      const decision2 = await policyEngine.evaluate(
        createBaseRequest({
          environment: {
            timestamp: new Date(),
            ipAddress: '192.168.1.1',
            isBusinessHours: false,
          },
        })
      );
      expect(decision2.allowed).toBe(false);
    });
  });

  describe('multiple policies', () => {
    it('should return first matching policy by priority', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Low Priority',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              actionAttr: 'action',
              operator: 'eq',
              value: '"read"',
            },
          ],
        },
        {
          id: 2,
          name: 'High Priority',
          effect: 'deny',
          priority: 100,
          isActive: true,
          conditions: [
            {
              id: 2,
              policyId: 2,
              subjectAttr: 'role',
              operator: 'eq',
              value: '"viewer"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(false);
      expect(decision.policyId).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined subject attribute', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [
            {
              id: 1,
              policyId: 1,
              subjectAttr: 'department',
              operator: 'eq',
              value: '"engineering"',
            },
          ],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(false);
    });

    it('should handle policy with no conditions', async () => {
      mockPolicyRepository.findActive.mockResolvedValue([
        {
          id: 1,
          name: 'No Conditions',
          effect: 'permit',
          priority: 10,
          isActive: true,
          conditions: [],
        },
      ]);

      const decision = await policyEngine.evaluate(createBaseRequest());
      expect(decision.allowed).toBe(false);
    });
  });
});
