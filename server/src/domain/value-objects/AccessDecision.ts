export interface AccessDecision {
  allowed: boolean;
  reason: string;
  policyId?: number;
  policyName?: string;
}
