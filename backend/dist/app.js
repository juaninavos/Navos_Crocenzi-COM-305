// src/app.ts
import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
// import cors from 'cors';  // Comentado temporalmente hasta instalar @types/cors
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';
// Importar rutas
import usuarioRoutes from './routes/usuarioRoutes';
import camisetaRoutes from './routes/camisetaRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import ofertaRoutes from './routes/ofertaRoutes.js';
import subastaRoutes from './routes/subastaRoutes.js';
import compraRoutes from './routes/compraRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import descuentoRoutes from './routes/descuentoRoutes.js';
import metodoPagoRoutes from './routes/metodoPagoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRouter from './controllers/AuthController.js';
import authMiddleware from './middleware/auth.js';
import roleGuard from './middleware/roleGuard.js';
async function main() {
    const orm = await MikroORM.init(config);
    const app = express();
    // Middleware
    app.use(express.json());
    // CORS configurado (comentado temporalmente)
    // app.use(cors({
    //   origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    //   credentials: true
    // }));
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
    app.use('/api/metodos-pago', metodoPagoRoutes); // ✅ AGREGAR ESTA LÍNEA
    app.use('/api/admin', adminRoutes); // ✅ AGREGAR: Rutas del administrador
    // 🚀 FASE 2: APROBACIÓN - Se agregarán más adelante
    // app.use('/api/subastas', subastaRoutes);
    // app.use('/api/ofertas', ofertaRoutes);
    // app.use('/api/compras', compraRoutes);
    // Ruta de salud para verificar que funciona
    app.get('/api/health', (req, res) => {
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
    // Ejemplo: ruta protegida por JWT y por role
    app.get('/api/protegida/admin', authMiddleware(), roleGuard(['admin']), (req, res) => {
        res.json({ message: 'Acceso concedido a administrador' });
    });
    // Middleware para rutas no encontradas (debe ir después de todas las rutas)
    app.use(notFoundHandler);
    // Middleware global de manejo de errores (debe ir al final)
    app.use(errorHandler);
    // Puerto del servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📋 Fase actual: REGULARIDAD`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}
main().catch(console.error);
