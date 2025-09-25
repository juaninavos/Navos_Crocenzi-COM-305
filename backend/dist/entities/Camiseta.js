var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Usuario } from './Usuario.js'; // ✅ AGREGAR .js
import { Categoria } from './Categoria.js'; // ✅ AGREGAR .js
export var Talle;
(function (Talle) {
    Talle["XS"] = "XS";
    Talle["S"] = "S";
    Talle["M"] = "M";
    Talle["L"] = "L";
    Talle["XL"] = "XL";
    Talle["XXL"] = "XXL";
})(Talle || (Talle = {}));
export var CondicionCamiseta;
(function (CondicionCamiseta) {
    CondicionCamiseta["NUEVA"] = "Nueva";
    CondicionCamiseta["USADA"] = "Usada";
    CondicionCamiseta["VINTAGE"] = "Vintage";
})(CondicionCamiseta || (CondicionCamiseta = {}));
export var EstadoCamiseta;
(function (EstadoCamiseta) {
    EstadoCamiseta["DISPONIBLE"] = "disponible";
    EstadoCamiseta["VENDIDA"] = "vendida";
    EstadoCamiseta["EN_SUBASTA"] = "en_subasta";
    EstadoCamiseta["INACTIVA"] = "inactiva";
})(EstadoCamiseta || (EstadoCamiseta = {}));
let Camiseta = class Camiseta {
    constructor(titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, vendedor) {
        this.esSubasta = false;
        this.stock = 1;
        this.estado = EstadoCamiseta.DISPONIBLE;
        this.fechaCreacion = new Date(); // ✅ AGREGAR: Para ordenamiento en AdminController
        this.fechaPublicacion = new Date();
        this.subastas = new Collection(this);
        this.compras = new Collection(this);
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.equipo = equipo;
        this.temporada = temporada;
        this.talle = talle;
        this.condicion = condicion;
        this.imagen = imagen;
        this.precioInicial = precioInicial;
        this.vendedor = vendedor;
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", Number)
], Camiseta.prototype, "id", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Camiseta.prototype, "titulo", void 0);
__decorate([
    Property({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Camiseta.prototype, "descripcion", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Camiseta.prototype, "equipo", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Camiseta.prototype, "temporada", void 0);
__decorate([
    Enum(() => Talle),
    __metadata("design:type", String)
], Camiseta.prototype, "talle", void 0);
__decorate([
    Enum(() => CondicionCamiseta),
    __metadata("design:type", String)
], Camiseta.prototype, "condicion", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", String)
], Camiseta.prototype, "imagen", void 0);
__decorate([
    Property({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Camiseta.prototype, "precioInicial", void 0);
__decorate([
    Property({ default: false }),
    __metadata("design:type", Boolean)
], Camiseta.prototype, "esSubasta", void 0);
__decorate([
    Property({ default: 1 }),
    __metadata("design:type", Number)
], Camiseta.prototype, "stock", void 0);
__decorate([
    Enum(() => EstadoCamiseta),
    __metadata("design:type", String)
], Camiseta.prototype, "estado", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Camiseta.prototype, "fechaCreacion", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Camiseta.prototype, "fechaPublicacion", void 0);
__decorate([
    ManyToOne('Usuario'),
    __metadata("design:type", Usuario)
], Camiseta.prototype, "vendedor", void 0);
__decorate([
    ManyToOne('Categoria', { nullable: true }),
    __metadata("design:type", Categoria)
], Camiseta.prototype, "categoria", void 0);
__decorate([
    OneToMany('Subasta', 'camiseta'),
    __metadata("design:type", Object)
], Camiseta.prototype, "subastas", void 0);
__decorate([
    OneToMany('Compra', 'camiseta') // ✅ AGREGAR: Relación con compras
    ,
    __metadata("design:type", Object)
], Camiseta.prototype, "compras", void 0);
Camiseta = __decorate([
    Entity(),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Number, Usuario])
], Camiseta);
export { Camiseta };
