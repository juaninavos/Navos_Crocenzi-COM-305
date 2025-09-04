"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
require("reflect-metadata");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
// import cors from 'cors';  // Comentado temporalmente hasta instalar @types/cors
const core_1 = require("@mikro-orm/core");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
// Importar rutas
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const camisetaRoutes_1 = __importDefault(require("./routes/camisetaRoutes"));
const categoriaRoutes_1 = __importDefault(require("./routes/categoriaRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
async function main() {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    const app = (0, express_1.default)();
    // Middleware
    app.use(express_1.default.json());
    // CORS configurado (comentado temporalmente)
    // app.use(cors({
    //   origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    //   credentials: true
    // }));
    // Hacer ORM disponible en todas las rutas
    app.locals.orm = orm;
    // 🎯 FASE 1: REGULARIDAD - Rutas básicas
    app.use('/api/usuarios', usuarioRoutes_1.default);
    app.use('/api/camisetas', camisetaRoutes_1.default);
    app.use('/api/categorias', categoriaRoutes_1.default);
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
    // Middleware para rutas no encontradas (debe ir después de todas las rutas)
    app.use(errorHandler_1.notFoundHandler);
    // Middleware global de manejo de errores (debe ir al final)
    app.use(errorHandler_1.errorHandler);
    // Puerto del servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📋 Fase actual: REGULARIDAD`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}
main().catch(console.error);
//# sourceMappingURL=app.js.map