"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("@mikro-orm/mysql");
const Usuario_1 = require("./entities/Usuario");
const Camiseta_1 = require("./entities/Camiseta");
const Subasta_1 = require("./entities/Subasta");
const Oferta_1 = require("./entities/Oferta");
const Compra_1 = require("./entities/Compra");
const MetodoPago_1 = require("./entities/MetodoPago");
const Pago_1 = require("./entities/Pago");
const Categoria_1 = require("./entities/Categoria");
const Descuento_1 = require("./entities/Descuento");
exports.default = (0, mysql_1.defineConfig)({
    dbName: process.env.DB_NAME || 'tienda_retro',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    entities: [Usuario_1.Usuario, Camiseta_1.Camiseta, Subasta_1.Subasta, Oferta_1.Oferta, Compra_1.Compra, MetodoPago_1.MetodoPago, Pago_1.Pago, Categoria_1.Categoria, Descuento_1.Descuento],
    debug: true,
    migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations',
    },
});
//# sourceMappingURL=mikro-orm.config.js.map