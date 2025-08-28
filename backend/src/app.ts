// src/app.ts
import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';

// Importar rutas
import usuarioRoutes from './routes/usuarioRoutes';
import camisetaRoutes from './routes/camisetaRoutes';  // ← Descomentar

async function main() {
  const orm = await MikroORM.init(config);
  const app = express();

  // Middleware
  app.use(express.json());
  
  // Hacer ORM disponible en todas las rutas
  app.locals.orm = orm;

  // 🎯 FASE 1: REGULARIDAD - Rutas básicas
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/camisetas', camisetaRoutes);  // ← Descomentar
  
  // 🚀 FASE 2: APROBACIÓN - Se agregarán más adelante
  // app.use('/api/subastas', subastaRoutes);
  // app.use('/api/ofertas', ofertaRoutes);
  // app.use('/api/compras', compraRoutes);

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
        'GET /api/camisetas',          // ← Agregar
        'POST /api/camisetas'          // ← Agregar
      ]
    });
  });

  // Puerto del servidor
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Fase actual: REGULARIDAD`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch(console.error);
