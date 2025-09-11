import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/auth';

export default function authMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = header.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || '';
      if (!secret) throw new Error('JWT_SECRET no configurado');
      const payload = jwt.verify(token, secret) as any;
      const user: AuthUser = { id: payload.id, rol: payload.rol, email: payload.email || '' } as AuthUser;
      (req as any).user = user;
      next();
    } catch (err) {
      console.error('auth middleware verify error', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
