"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camiseta = void 0;
const core_1 = require("@mikro-orm/core");
let Camiseta = class Camiseta {
};
__decorate([
    (0, core_1.PrimaryKey)(),
    __metadata("design:type", Number)
], Camiseta.prototype, "id", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "marca", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "modelo", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "talle", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Number)
], Camiseta.prototype, "precio", void 0);
Camiseta = __decorate([
    (0, core_1.Entity)()
], Camiseta);
exports.Camiseta = Camiseta;
//# sourceMappingURL=Camiseta.js.map