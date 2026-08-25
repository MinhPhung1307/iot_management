import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload } from '../types';
import { ConflictError, UnauthorizedError, NotFoundError } from '../middleware/AppError';

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

export const login = async (data: { email: string; password: string }) => {
  const user = await User.findOne({ where: { email: data.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

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
