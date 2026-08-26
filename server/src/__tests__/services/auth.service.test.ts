jest.mock('../../models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  };
  return { __esModule: true, default: mockUser };
});

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn().mockResolvedValue([
      [{ name: 'device:read' }, { name: 'group:read' }, { name: 'schedule:read' }],
      [],
    ]),
  },
}));

jest.mock('jsonwebtoken');
jest.mock('../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  },
}));

import jwt from 'jsonwebtoken';
import User from '../../models/User';
import sequelize from '../../config/database';
import { register, login, getMe } from '../../services/auth.service';
import { AppError } from '../../middleware/AppError';
import redis from '../../config/redis';

const mockUser = User as jest.Mocked<typeof User>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockRedis = redis as jest.Mocked<typeof redis>;
const mockSequelize = sequelize as jest.Mocked<typeof sequelize>;

describe('auth.service', () => {
  const fakeUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'viewer',
    department: null,
    location: null,
    clearanceLevel: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSequelize.query as jest.Mock).mockResolvedValue([
      [{ name: 'device:read' }, { name: 'group:read' }, { name: 'schedule:read' }],
      [],
    ]);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue(fakeUser);
      mockJwt.sign.mockReturnValue('mock-token' as any);

      const result = await register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockUser.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'viewer',
      });
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'viewer',
          department: null,
          location: null,
          clearanceLevel: 1,
          permissions: ['device:read', 'group:read', 'schedule:read'],
        },
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      mockUser.findOne.mockResolvedValue(fakeUser);

      await expect(
        register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(AppError);

      try {
        await register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
        expect((e as AppError).message).toBe('Email already exists');
      }

      expect(mockUser.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockRedis.get.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockRedis.del.mockResolvedValue(1);
      mockJwt.sign.mockReturnValue('mock-token' as any);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockRedis.get).toHaveBeenCalledWith('login_locked:test@example.com');
      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(userWithCompare.comparePassword).toHaveBeenCalledWith('password123');
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'viewer',
          department: null,
          location: null,
          clearanceLevel: 1,
          permissions: ['device:read', 'group:read', 'schedule:read'],
        },
        token: 'mock-token',
      });
    });

    it('should reset login attempts on successful login', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('2');
      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockRedis.del.mockResolvedValue(1);
      mockJwt.sign.mockReturnValue('mock-token' as any);

      await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockRedis.del).toHaveBeenCalledWith('login_attempts:test@example.com');
    });

    it('should throw UnauthorizedError if account is locked', async () => {
      mockRedis.get.mockResolvedValue('locked');
      mockRedis.ttl.mockResolvedValue(1200);

      await expect(
        login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(AppError);

      try {
        await login({ email: 'test@example.com', password: 'password123' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(401);
        expect((e as AppError).message).toContain('Account locked');
      }

      expect(mockUser.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(null);

      await expect(
        login({ email: 'wrong@example.com', password: 'password123' })
      ).rejects.toThrow(AppError);

      try {
        await login({ email: 'wrong@example.com', password: 'password123' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(401);
        expect((e as AppError).message).toBe('Invalid credentials');
      }
    });

    it('should increment login attempts on wrong password', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('2');
      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockRedis.set.mockResolvedValue('OK');

      await expect(
        login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(AppError);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'login_attempts:test@example.com',
        '3',
        'EX',
        expect.any(Number)
      );
    });

    it('should lock account after max attempts', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('4');
      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockRedis.set.mockResolvedValue('OK');

      try {
        await login({ email: 'test@example.com', password: 'wrongpassword' });
      } catch (e) {
        expect((e as AppError).message).toContain('Too many failed attempts');
      }

      expect(mockRedis.set).toHaveBeenCalledWith(
        'login_locked:test@example.com',
        'locked',
        'EX',
        expect.any(Number)
      );
    });

    it('should return same structure as register', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockRedis.get.mockResolvedValue(null);
      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockRedis.del.mockResolvedValue(1);
      mockJwt.sign.mockReturnValue('token-456' as any);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'viewer',
        department: null,
        location: null,
        clearanceLevel: 1,
        permissions: ['device:read', 'group:read', 'schedule:read'],
      });
    });
  });

  describe('getMe', () => {
    it('should return user profile when user exists', async () => {
      mockUser.findByPk.mockResolvedValue(fakeUser);

      const result = await getMe(1);

      expect(mockUser.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'viewer',
          department: null,
          location: null,
          clearanceLevel: 1,
          permissions: ['device:read', 'group:read', 'schedule:read'],
        },
      });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockUser.findByPk.mockResolvedValue(null);

      await expect(getMe(999)).rejects.toThrow(AppError);

      try {
        await getMe(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('User not found');
      }
    });

    it('should not return password in response', async () => {
      mockUser.findByPk.mockResolvedValue(fakeUser);

      const result = await getMe(1);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
