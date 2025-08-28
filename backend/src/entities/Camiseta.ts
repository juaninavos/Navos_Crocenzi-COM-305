import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Usuario } from './Usuario';
import { Categoria } from './Categoria';
import { Subasta } from './Subasta';

export enum Talle {
  XS = 'XS',
  S = 'S', 
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL'
}

export enum CondicionCamiseta {
  NUEVA = 'Nueva',
  USADA = 'Usada',
  VINTAGE = 'Vintage'
}

export enum EstadoCamiseta {
  DISPONIBLE = 'disponible',
  VENDIDA = 'vendida',
  EN_SUBASTA = 'en_subasta',
  INACTIVA = 'inactiva'
}

@Entity()
export class Camiseta {
  @PrimaryKey()
  id!: number;

  @Property()
  titulo!: string;

  @Property({ type: 'text', nullable: true })
  descripcion?: string;

  @Property()
  equipo!: string;

  @Property()
  temporada!: string;

  @Enum(() => Talle)
  talle!: Talle;

  @Enum(() => CondicionCamiseta)
  condicion!: CondicionCamiseta;

  @Property({ nullable: true })
  imagen?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  precioInicial!: number;

  @Property({ default: false })
  esSubasta: boolean = false;

  @Property({ default: 1 })
  stock: number = 1;

  @Enum(() => EstadoCamiseta)
  estado: EstadoCamiseta = EstadoCamiseta.DISPONIBLE;

  @ManyToOne('Usuario')
  vendedor!: Usuario;

  @ManyToOne('Categoria', { nullable: true })
  categoria?: Categoria;

  @OneToMany('Subasta', 'camiseta')
  subastas = new Collection<Subasta>(this);

  @Property()
  fechaPublicacion: Date = new Date();

  constructor(
    titulo: string,
    descripcion: string,
    equipo: string,
    temporada: string,
    talle: Talle,
    condicion: CondicionCamiseta,
    imagen: string,
    precioInicial: number,
    vendedorId: number
  ) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.equipo = equipo;
    this.temporada = temporada;
    this.talle = talle;
    this.condicion = condicion;
    this.imagen = imagen;
    this.precioInicial = precioInicial;
    this.vendedor = vendedorId as any;
  }
}

