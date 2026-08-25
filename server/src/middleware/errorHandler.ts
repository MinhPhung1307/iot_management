import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    });
    return;
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = (err as any).errors.map((e: any) => e.message);
    res.status(400).json({ message: 'Validation error', errors: messages });
    return;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = (err as any).errors.map((e: any) => e.message);
    res.status(409).json({ message: 'Duplicate entry', errors: messages });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ message: 'Token expired' });
    return;
  }

  // Unknown error
  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Internal server error' });
};
