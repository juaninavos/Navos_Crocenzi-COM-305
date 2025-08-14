"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
require("reflect-metadata");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const core_1 = require("@mikro-orm/core");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const Camiseta_1 = require("./entities/Camiseta");
async function main() {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Endpoint para listar camisetas
    app.get('/camisetas', async (req, res) => {
        try {
            const camisetas = await orm.em.find(Camiseta_1.Camiseta, {});
            res.json(camisetas);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener camisetas' });
        }
    });
    // Puerto del servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
main().catch(console.error);
//# sourceMappingURL=app.js.map