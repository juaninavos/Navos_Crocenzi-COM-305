"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
function main() {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    console.log('ORM initialized');
    await orm.close(true);
}
main().catch(console.error);
//# sourceMappingURL=app.js.map