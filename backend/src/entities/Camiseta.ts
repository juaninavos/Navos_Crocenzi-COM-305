import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Usuario } from './Usuario';
import { Categoria } from './Categoria';

export enum EstadoCamiseta {
  DISPONIBLE = 'disponible',
  EN_SUBASTA = 'en_subasta',
  VENDIDA = 'vendida',
  PAUSADA = 'pausada'
}

export enum CondicionCamiseta {
  NUEVA = 'nueva',
  EXCELENTE = 'excelente',
  MUY_BUENA = 'muy_buena',
  BUENA = 'buena',
  REGULAR = 'regular'
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

  @Property()
  talle!: string;

  @Enum(() => CondicionCamiseta)
  condicion!: CondicionCamiseta;

  @Property()
  imagen!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
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
  subastas = new Collection<any>(this);

  @OneToMany('Compra', 'camiseta')
  compras = new Collection<any>(this);

  constructor(titulo: string, descripcion: string, equipo: string, temporada: string, talle: string, condicion: CondicionCamiseta, imagen: string, precioInicial: number, vendedor: Usuario, esSubasta: boolean = false) {
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
}

