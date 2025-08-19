import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Usuario } from './Usuario';
import { Categoria } from './Categoria';
import { Compra } from './Compra';
import { Subasta } from './Subasta';

export enum EstadoCamiseta {
  DISPONIBLE = 'disponible',
  EN_SUBASTA = 'en_subasta',
  VENDIDA = 'vendida',
  PAUSADA = 'pausada',
  AGOTADA = 'agotada'
}

export enum CondicionCamiseta {
  NUEVA = 'nueva',
  POCO_USADA = 'poco_usada',
  EXCELENTE = 'excelente',
  MUY_BUENA = 'muy_buena',
  BUENA = 'buena',
  REGULAR = 'regular'
}

export enum Talle {
  XS = 'XS',
  S = 'S',
  M = 'M', 
  L = 'L',
  XL = 'XL', 
  XXL = 'XXL'
}

@Entity()
export class Camiseta {
  @PrimaryKey()
  id!: number;

  @Property()
  titulo!: string;

  @Property({ type: 'text' })
  descripcion!: string;

  @Property()
  equipo!: string;

  @Property()
  temporada!: string;

  @Enum(() => Talle)
  talle!: Talle;

  @Enum(() => CondicionCamiseta)
  condicion!: CondicionCamiseta;

  @Property()
  imagen!: string;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  precioInicial!: number;

  @Property()
  stock: number = 1;

  @Property()
  esSubasta: boolean = false;

  @Enum(() => EstadoCamiseta)
  estado: EstadoCamiseta = EstadoCamiseta.DISPONIBLE;

  @Property()
  fechaPublicacion: Date = new Date();

  // Relaciones
  @ManyToOne(() => Usuario)
  vendedor!: Usuario;

  @ManyToOne(() => Categoria, { nullable: true })
  categoria?: Categoria;

  @OneToMany('Subasta', 'camiseta')
  subastas = new Collection<Subasta>(this);

  @OneToMany('Compra', 'camiseta')
  compras = new Collection<Compra>(this);

  constructor(titulo: string, descripcion: string, equipo: string, temporada: string, talle: Talle, condicion: CondicionCamiseta, imagen: string, precioInicial: number, vendedor: Usuario, esSubasta: boolean = false) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.equipo = equipo;
    this.temporada = temporada;
    this.talle = talle ;
    this.condicion = condicion;
    this.imagen = imagen;
    this.precioInicial = precioInicial;
    this.vendedor = vendedor;
    this.esSubasta = esSubasta;
    this.estado = esSubasta ? EstadoCamiseta.EN_SUBASTA : EstadoCamiseta.DISPONIBLE;
  }
}

