// src/app.ts
import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';  // ✅ DESCOMMENTAR
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';

// Importar rutas
import usuarioRoutes from './routes/usuarioRoutes';
import camisetaRoutes from './routes/camisetaRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import ofertaRoutes from './routes/ofertaRoutes';
import subastaRoutes from './routes/subastaRoutes';
import compraRoutes from './routes/compraRoutes';
import pagoRoutes from './routes/pagoRoutes';
import descuentoRoutes from './routes/descuentoRoutes';
import metodoPagoRoutes from './routes/metodoPagoRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRouter from './controllers/AuthController';
import authMiddleware from './middleware/auth';
import roleGuard from './middleware/roleGuard';

async function main() {
  const orm = await MikroORM.init(config);
  const app = express();

  // ✅ CORS HABILITADO - DEBE IR ANTES DE express.json()
  // Permitir orígenes de desarrollo comunes y hacerlo configurable por variable de entorno
  const defaultAllowed = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
  const envAllowed = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const allowedOrigins = envAllowed.length > 0 ? envAllowed : defaultAllowed;

  app.use(cors({
    origin: (origin, cb) => {
      // permitir llamadas sin origin (curl, servidores internos)
      if (!origin) return cb(null, true);
      // en producción, validar contra lista; en desarrollo, ser más permisivo
      const isAllowed = allowedOrigins.includes(origin);
      if (isAllowed || process.env.NODE_ENV !== 'production') return cb(null, true);
      return cb(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Middleware
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    console.log('📦 Body:', req.body);
    console.log('🌐 Origin:', req.get('origin'));
    next();
  });

  // Hacer ORM disponible en todas las rutas
  app.locals.orm = orm;

  // Auth routes
  app.use('/api/auth', authRouter(orm));

  // 🎯 FASE 1: REGULARIDAD - Rutas básicas
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/categorias', categoriaRoutes);
  app.use('/api/camisetas', camisetaRoutes);
  app.use('/api/ofertas', ofertaRoutes);
  app.use('/api/subastas', subastaRoutes);
  app.use('/api/compras', compraRoutes);
  app.use('/api/pagos', pagoRoutes);
  app.use('/api/descuentos', descuentoRoutes);
  app.use('/api/metodos-pago', metodoPagoRoutes);  
  app.use('/api/admin', adminRoutes);  
  

  // Ruta de salud para verificar que funciona
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: 'API Tienda Retro funcionando',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/health',
        'GET /api/usuarios',
        'POST /api/usuarios',
        'GET /api/camisetas',
        'POST /api/camisetas',
        'POST /api/camisetas/publicar',
        'GET /api/categorias',
        'POST /api/categorias'
      ]
    });
  });

  // DEBUG: endpoint temporal para inspeccionar query params que llegan al backend
  app.get('/api/debug/echo', (req: Request, res: Response) => {
    // Devolver exactamente lo que vino en req.query para pruebas rápidas
    res.json({ success: true, query: req.query });
  });

  // Ejemplo: ruta protegida por JWT y por role
  app.get('/api/protegida/admin', authMiddleware, roleGuard(['admin']), (req, res) => {
    res.json({ 
      success: true, 
      message: 'Acceso permitido para admin',
      usuario: req.user 
    });
  });

  // Middleware para rutas no encontradas (debe ir después de todas las rutas)
  app.use(notFoundHandler);

  // Middleware global de manejo de errores (debe ir al final)
  app.use(errorHandler);

  // Puerto del servidor
  const PORT = Number(process.env.PORT) || 3001; // ✅ CAMBIAR AQUÍ
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`📋 Fase actual: REGULARIDAD`);
    console.log(`🔗 Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
    console.log(`🌐 Escuchando en interfaces: ${HOST}`);
  });
}

main().catch(console.error);

