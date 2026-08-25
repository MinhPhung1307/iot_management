import { validate } from '../../middleware/validate';
import { z } from 'zod';

describe('validate middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  const bodySchema = z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),
    }),
  });

  const querySchema = z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/),
    }),
  });

  const paramsSchema = z.object({
    params: z.object({
      id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
  });

  const fullSchema = z.object({
    body: z.object({ email: z.string().email() }),
    query: z.object({ limit: z.string().optional() }),
    params: z.object({ id: z.string() }),
  });

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('body validation', () => {
    it('should call next() when body is valid', () => {
      req.body = { name: 'test' };
      validate(bodySchema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when body field is missing', () => {
      req.body = {};
      validate(bodySchema)(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'body.name' }),
          ]),
        })
      );
    });

    it('should return 400 when body field is empty string', () => {
      req.body = { name: '' };
      validate(bodySchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('query validation', () => {
    it('should call next() when query is valid', () => {
      req.query = { page: '1' };
      validate(querySchema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when query format is invalid', () => {
      req.query = { page: 'abc' };
      validate(querySchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('params validation', () => {
    it('should call next() when params are valid', () => {
      req.params = { id: '123' };
      validate(paramsSchema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 when params format is invalid', () => {
      req.params = { id: 'abc' };
      validate(paramsSchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('full schema validation', () => {
    it('should call next() when all parts are valid', () => {
      req.body = { email: 'test@example.com' };
      req.query = { limit: '10' };
      req.params = { id: '1' };
      validate(fullSchema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 when body is invalid but query/params valid', () => {
      req.body = { email: 'invalid' };
      req.query = { limit: '10' };
      req.params = { id: '1' };
      validate(fullSchema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('non-Zod errors', () => {
    it('should pass non-Zod errors to next()', () => {
      const failingSchema = z.object({
        body: z.object({
          value: z.any().transform(() => {
            throw new Error('Custom error');
          }),
        }),
      });
      req.body = { value: 'test' };
      validate(failingSchema)(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
