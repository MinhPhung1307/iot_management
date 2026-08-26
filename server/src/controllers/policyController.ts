import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as policyService from '../services/policy.service';

export const getPolicies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const policies = await policyService.getPolicies();
    res.json(policies);
  } catch (error) {
    next(error);
  }
};

export const getPolicyById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const policy = await policyService.getPolicyById(id);
    res.json(policy);
  } catch (error) {
    next(error);
  }
};

export const createPolicy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const policy = await policyService.createPolicy(req.body);
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
};

export const updatePolicy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const policy = await policyService.updatePolicy(id, req.body);
    res.json(policy);
  } catch (error) {
    next(error);
  }
};

export const deletePolicy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await policyService.deletePolicy(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const togglePolicyActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const policy = await policyService.togglePolicyActive(id);
    res.json(policy);
  } catch (error) {
    next(error);
  }
};
