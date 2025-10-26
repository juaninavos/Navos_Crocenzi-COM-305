import { Request, Response, NextFunction } from 'express';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // ✅ SIN JWT: Simplemente verificar que haya header (sin validar)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }

  // ✅ Por ahora, dejar pasar sin verificar token real
  // En producción, aquí iría la verificación de JWT
  next();
};

export default authMiddleware;
