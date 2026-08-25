import jwt from 'jsonwebtoken';

jest.mock('../../models/User', () => {
  const mockModel: any = {
    findByPk: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

import User from '../../models/User';
import { authenticate, authorize } from '../../middleware/auth';

const mockUser = User as any;

describe('authenticate middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const fakeUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() and attach user when token is valid', async () => {
    req.headers.authorization = 'Bearer valid-token';
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 1, email: 'test@example.com', role: 'user' } as any);
    mockUser.findByPk.mockResolvedValue(fakeUser);

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(mockUser.findByPk).toHaveBeenCalledWith(1);
    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no Authorization header', async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Basic token123';

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 when token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should return 401 when token is expired', async () => {
    req.headers.authorization = 'Bearer expired-token';
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should return 401 when user not found in database', async () => {
    req.headers.authorization = 'Bearer valid-token';
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 999, email: 'deleted@example.com', role: 'user' } as any);
    mockUser.findByPk.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
});

describe('authorize middleware', () => {
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
  });

  it('should call next() when user has required role', () => {
    req.user = { id: 1, role: 'admin' };

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() when user role is in allowed roles list', () => {
    req.user = { id: 1, role: 'user' };

    authorize('admin', 'user')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should return 403 when user role is not in allowed roles', () => {
    req.user = { id: 1, role: 'user' };

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user is not authenticated', () => {
    req.user = undefined;

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
  });

  it('should return 403 when user has no role', () => {
    req.user = { id: 1 };

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
