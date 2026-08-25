import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload } from '../types';
import { ConflictError, UnauthorizedError, NotFoundError } from '../middleware/AppError';
import redis from '../config/redis';
import { RATE_LIMIT_CONFIG } from '../config/rateLimit';

const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  } as jwt.SignOptions);
};

const getLoginAttempts = async (email: string): Promise<number> => {
  const key = `${RATE_LIMIT_CONFIG.ATTEMPT_KEY_PREFIX}${email}`;
  const attempts = await redis.get(key);
  return attempts ? parseInt(attempts, 10) : 0;
};

const incrementLoginAttempts = async (email: string): Promise<number> => {
  const key = `${RATE_LIMIT_CONFIG.ATTEMPT_KEY_PREFIX}${email}`;
  const attempts = await getLoginAttempts(email);
  const newAttempts = attempts + 1;
  const lockSeconds = RATE_LIMIT_CONFIG.LOCK_TIME_MINUTES * 60;

  await redis.set(key, newAttempts.toString(), 'EX', lockSeconds);
  return newAttempts;
};

const resetLoginAttempts = async (email: string): Promise<void> => {
  const key = `${RATE_LIMIT_CONFIG.ATTEMPT_KEY_PREFIX}${email}`;
  await redis.del(key);
};

const isAccountLocked = async (email: string): Promise<boolean> => {
  const key = `${RATE_LIMIT_CONFIG.LOCK_KEY_PREFIX}${email}`;
  const locked = await redis.get(key);
  return locked !== null;
};

const lockAccount = async (email: string): Promise<void> => {
  const key = `${RATE_LIMIT_CONFIG.LOCK_KEY_PREFIX}${email}`;
  const lockSeconds = RATE_LIMIT_CONFIG.LOCK_TIME_MINUTES * 60;
  await redis.set(key, 'locked', 'EX', lockSeconds);
};

export const getLockRemainingTime = async (email: string): Promise<number> => {
  const key = `${RATE_LIMIT_CONFIG.LOCK_KEY_PREFIX}${email}`;
  const ttl = await redis.ttl(key);
  
  // ttl = -2: key không tồn tại (chưa bị lock)
  // ttl = -1: key tồn tại nhưng không có TTL
  // ttl >= 0: số giây còn lại
  
  if (ttl < 0) return 0;
  return ttl;  // Số giây còn lại
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
}) => {
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new ConflictError('Email already exists');
  }

  const user = await User.create({
    email: data.email,
    password: data.password,
    name: data.name,
    role: 'user',
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const login = async (data: { email: string; password: string }) => {
  if (await isAccountLocked(data.email)) {
    const lockTime = await getLockRemainingTime(data.email);
    throw new UnauthorizedError(
      `Account locked due to too many failed attempts. Try again later ${Math.ceil(lockTime / 60)} min ${lockTime % 60} sec.`
    );
  }

  const user = await User.findOne({ where: { email: data.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    const attempts = await incrementLoginAttempts(data.email);
    if (attempts >= RATE_LIMIT_CONFIG.MAX_LOGIN_ATTEMPTS) {
      await lockAccount(data.email);
      throw new UnauthorizedError(
        `Too many failed attempts. Account locked for ${RATE_LIMIT_CONFIG.LOCK_TIME_MINUTES} minutes.`
      );
    }
    throw new UnauthorizedError('Invalid credentials');
  }

  await resetLoginAttempts(data.email);

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
};

export const getMe = async (userId: number) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};
