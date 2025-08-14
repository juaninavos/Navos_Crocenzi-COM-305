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
exports.Camiseta = exports.CondicionCamiseta = exports.EstadoCamiseta = void 0;
const core_1 = require("@mikro-orm/core");
const Usuario_1 = require("./Usuario");
const Categoria_1 = require("./Categoria");
var EstadoCamiseta;
(function (EstadoCamiseta) {
    EstadoCamiseta["DISPONIBLE"] = "disponible";
    EstadoCamiseta["EN_SUBASTA"] = "en_subasta";
    EstadoCamiseta["VENDIDA"] = "vendida";
    EstadoCamiseta["PAUSADA"] = "pausada";
})(EstadoCamiseta = exports.EstadoCamiseta || (exports.EstadoCamiseta = {}));
var CondicionCamiseta;
(function (CondicionCamiseta) {
    CondicionCamiseta["NUEVA"] = "nueva";
    CondicionCamiseta["EXCELENTE"] = "excelente";
    CondicionCamiseta["MUY_BUENA"] = "muy_buena";
    CondicionCamiseta["BUENA"] = "buena";
    CondicionCamiseta["REGULAR"] = "regular";
})(CondicionCamiseta = exports.CondicionCamiseta || (exports.CondicionCamiseta = {}));
let Camiseta = class Camiseta {
    constructor(titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, vendedor, esSubasta = false) {
        this.stock = 1;
        this.esSubasta = false;
        this.estado = EstadoCamiseta.DISPONIBLE;
        this.fechaPublicacion = new Date();
        this.subastas = new core_1.Collection(this);
        this.compras = new core_1.Collection(this);
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.equipo = equipo;
        this.temporada = temporada;
        this.talle = talle;
        this.condicion = condicion;
        this.imagen = imagen;
        this.precioInicial = precioInicial;
        this.vendedor = vendedor;
        this.esSubasta = esSubasta;
        this.estado = esSubasta ? EstadoCamiseta.EN_SUBASTA : EstadoCamiseta.DISPONIBLE;
    }
};
__decorate([
    (0, core_1.PrimaryKey)(),
    __metadata("design:type", Number)
], Camiseta.prototype, "id", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "titulo", void 0);
__decorate([
    (0, core_1.Property)({ type: 'text' }),
    __metadata("design:type", String)
], Camiseta.prototype, "descripcion", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "equipo", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "temporada", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "talle", void 0);
__decorate([
    (0, core_1.Enum)(() => CondicionCamiseta),
    __metadata("design:type", String)
], Camiseta.prototype, "condicion", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], Camiseta.prototype, "imagen", void 0);
__decorate([
    (0, core_1.Property)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Camiseta.prototype, "precioInicial", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Number)
], Camiseta.prototype, "stock", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Boolean)
], Camiseta.prototype, "esSubasta", void 0);
__decorate([
    (0, core_1.Enum)(() => EstadoCamiseta),
    __metadata("design:type", String)
], Camiseta.prototype, "estado", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Date)
], Camiseta.prototype, "fechaPublicacion", void 0);
__decorate([
    (0, core_1.ManyToOne)(() => Usuario_1.Usuario),
    __metadata("design:type", Usuario_1.Usuario)
], Camiseta.prototype, "vendedor", void 0);
__decorate([
    (0, core_1.ManyToOne)(() => Categoria_1.Categoria, { nullable: true }),
    __metadata("design:type", Categoria_1.Categoria)
], Camiseta.prototype, "categoria", void 0);
__decorate([
    (0, core_1.OneToMany)('Subasta', 'camiseta'),
    __metadata("design:type", Object)
], Camiseta.prototype, "subastas", void 0);
__decorate([
    (0, core_1.OneToMany)('Compra', 'camiseta'),
    __metadata("design:type", Object)
], Camiseta.prototype, "compras", void 0);
Camiseta = __decorate([
    (0, core_1.Entity)(),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Number, Usuario_1.Usuario, Boolean])
], Camiseta);
exports.Camiseta = Camiseta;
//# sourceMappingURL=Camiseta.js.map