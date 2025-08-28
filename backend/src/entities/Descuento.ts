import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Descuento {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  codigo!: string;

  @Property()
  descripcion!: string;

  @Property({ type: 'decimal', precision: 5, scale: 2 })
  porcentaje!: number;

  @Property()
  fechaInicio!: Date;

  @Property()
  fechaFin!: Date;

  @Property({ default: true })
  activo: boolean = true;

  @Property()
  fechaCreacion: Date = new Date();

  constructor(
    codigo: string,
    descripcion: string,
    porcentaje: number,
    fechaInicio: Date,
    fechaFin: Date,
    activo: boolean = true
  ) {
    this.codigo = codigo;
    this.descripcion = descripcion;
    this.porcentaje = porcentaje;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.activo = activo;
  }
}
