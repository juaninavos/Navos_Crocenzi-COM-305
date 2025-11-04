import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware de autenticación con JWT que adjunta req.user
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = (req.headers.authorization || '') as string;

  if (!header.startsWith('Bearer ')) {
    console.warn('🔐 authMiddleware: falta Authorization Bearer. Header recibido =', header ? header.split(' ')[0] : 'none');
    return res.status(401).json({
      success: false,
      message: 'No autorizado: token requerido.',
      error: 'Token requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Configuración inválida del servidor (JWT_SECRET no definido)'
    });
  }

  try {
    const payload = jwt.verify(token, secret) as any;
    const id = typeof payload.id === 'number' ? payload.id : Number(payload.id ?? payload.sub);
    req.user = { id, rol: payload.rol, email: payload.email || '' } as any;
    return next();
  } catch (err) {
    console.warn('🔐 authMiddleware: token inválido:', (err as Error)?.message);
    return res.status(401).json({
      success: false,
      message: 'No autorizado: token inválido.',
      error: 'Token inválido',
      code: 'TOKEN_INVALID'
    });
  }
};

export default authMiddleware;
