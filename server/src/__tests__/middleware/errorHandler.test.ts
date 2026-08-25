import { errorHandler } from '../../middleware/errorHandler';
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../middleware/AppError';

describe('errorHandler middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError instances', () => {
    it('should handle NotFoundError (404)', () => {
      const err = new NotFoundError('Device');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Device not found' });
    });

    it('should handle BadRequestError (400)', () => {
      const err = new BadRequestError('Invalid input');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
    });

    it('should handle UnauthorizedError (401)', () => {
      const err = new UnauthorizedError();
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should handle ForbiddenError (403)', () => {
      const err = new ForbiddenError();
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('should handle ConflictError (409)', () => {
      const err = new ConflictError('Email already exists');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });

    it('should handle generic AppError', () => {
      const err = new AppError('Custom error', 422);
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ message: 'Custom error' });
    });
  });

  describe('Sequelize errors', () => {
    it('should handle SequelizeValidationError (400)', () => {
      const err = new Error('Validation failed');
      err.name = 'SequelizeValidationError';
      (err as any).errors = [
        { message: 'Email is invalid' },
        { message: 'Password is too short' },
      ];
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation error',
        errors: ['Email is invalid', 'Password is too short'],
      });
    });

    it('should handle SequelizeUniqueConstraintError (409)', () => {
      const err = new Error('Unique constraint failed');
      err.name = 'SequelizeUniqueConstraintError';
      (err as any).errors = [
        { message: 'email must be unique' },
      ];
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Duplicate entry',
        errors: ['email must be unique'],
      });
    });
  });

  describe('JWT errors', () => {
    it('should handle JsonWebTokenError (401)', () => {
      const err = new Error('jwt malformed');
      err.name = 'JsonWebTokenError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should handle TokenExpiredError (401)', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
    });
  });

  describe('unknown errors', () => {
    it('should handle generic Error (500)', () => {
      const err = new Error('Something went wrong');
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('should log unexpected errors to console', () => {
      const err = new Error('Unexpected');
      errorHandler(err, req, res, next);
      expect(console.error).toHaveBeenCalledWith('Unexpected error:', err);
    });
  });
});
