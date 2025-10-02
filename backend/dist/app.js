"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
require("reflect-metadata");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // ✅ DESCOMMENTAR
const core_1 = require("@mikro-orm/core");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
// Importar rutas
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const camisetaRoutes_1 = __importDefault(require("./routes/camisetaRoutes"));
const categoriaRoutes_1 = __importDefault(require("./routes/categoriaRoutes"));
const ofertaRoutes_1 = __importDefault(require("./routes/ofertaRoutes"));
const subastaRoutes_1 = __importDefault(require("./routes/subastaRoutes"));
const compraRoutes_1 = __importDefault(require("./routes/compraRoutes"));
const pagoRoutes_1 = __importDefault(require("./routes/pagoRoutes"));
const descuentoRoutes_1 = __importDefault(require("./routes/descuentoRoutes"));
const metodoPagoRoutes_1 = __importDefault(require("./routes/metodoPagoRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const AuthController_1 = __importDefault(require("./controllers/AuthController"));
const auth_1 = __importDefault(require("./middleware/auth"));
const roleGuard_1 = __importDefault(require("./middleware/roleGuard"));
async function main() {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    const app = (0, express_1.default)();
    // ✅ CORS HABILITADO - DEBE IR ANTES DE express.json()
    app.use((0, cors_1.default)({
        origin: 'http://localhost:5173', // ✅ Frontend URL
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    // Middleware
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        console.log(`🔍 ${req.method} ${req.url}`);
        console.log('📦 Body:', req.body);
        console.log('🌐 Origin:', req.get('origin'));
        next();
    });
    // Hacer ORM disponible en todas las rutas
    app.locals.orm = orm;
    // Auth routes
    app.use('/api/auth', (0, AuthController_1.default)(orm));
    // 🎯 FASE 1: REGULARIDAD - Rutas básicas
    app.use('/api/usuarios', usuarioRoutes_1.default);
    app.use('/api/categorias', categoriaRoutes_1.default);
    app.use('/api/camisetas', camisetaRoutes_1.default);
    app.use('/api/ofertas', ofertaRoutes_1.default);
    app.use('/api/subastas', subastaRoutes_1.default);
    app.use('/api/compras', compraRoutes_1.default);
    app.use('/api/pagos', pagoRoutes_1.default);
    app.use('/api/descuentos', descuentoRoutes_1.default);
    app.use('/api/metodos-pago', metodoPagoRoutes_1.default);
    app.use('/api/admin', adminRoutes_1.default);
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
    app.get('/api/protegida/admin', (0, auth_1.default)(), (0, roleGuard_1.default)(['admin']), (req, res) => {
        res.json({ message: 'Acceso concedido a administrador' });
    });
    // Middleware para rutas no encontradas (debe ir después de todas las rutas)
    app.use(errorHandler_1.notFoundHandler);
    // Middleware global de manejo de errores (debe ir al final)
    app.use(errorHandler_1.errorHandler);
    // Puerto del servidor
    const PORT = process.env.PORT || 3001; // ✅ CAMBIAR AQUÍ
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📋 Fase actual: REGULARIDAD`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
}
main().catch(console.error);
