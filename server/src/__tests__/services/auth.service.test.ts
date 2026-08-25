import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { register, login, getMe } from '../../services/auth.service';
import { AppError } from '../../middleware/AppError';

jest.mock('../../models/User');
jest.mock('jsonwebtoken');

const mockUser = User as jest.Mocked<typeof User>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('auth.service', () => {
  const fakeUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
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
        role: 'user',
      });
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        token: 'mock-token',
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

    it('should generate JWT token with correct payload', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue(fakeUser);
      mockJwt.sign.mockReturnValue('token-123' as any);

      await register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { id: 1, email: 'test@example.com', role: 'user' },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as User;

      mockUser.findOne.mockResolvedValue(userWithCompare);
      mockJwt.sign.mockReturnValue('mock-token' as any);

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUser.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(userWithCompare.comparePassword).toHaveBeenCalledWith('password123');
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        token: 'mock-token',
      });
    });

    it('should throw UnauthorizedError if user not found', async () => {
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

    it('should throw UnauthorizedError if password is invalid', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      } as unknown as User;

      mockUser.findOne.mockResolvedValue(userWithCompare);

      await expect(
        login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(AppError);

      try {
        await login({ email: 'test@example.com', password: 'wrongpassword' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(401);
        expect((e as AppError).message).toBe('Invalid credentials');
      }
    });

    it('should return same structure as register', async () => {
      const userWithCompare = {
        ...fakeUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as User;

      mockUser.findOne.mockResolvedValue(userWithCompare);
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
        role: 'user',
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
          role: 'user',
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
