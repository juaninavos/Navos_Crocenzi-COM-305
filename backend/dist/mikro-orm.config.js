"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("@mikro-orm/mysql");
const Camiseta_1 = require("./entities/Camiseta");
exports.default = (0, mysql_1.defineConfig)({
    dbName: 'tienda_retro',
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: 3306,
    entities: [Camiseta_1.Camiseta],
    debug: true,
});
//# sourceMappingURL=mikro-orm.config.js.map