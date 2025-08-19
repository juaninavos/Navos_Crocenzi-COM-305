import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { Camiseta } from './Camiseta';
import { Usuario } from './Usuario';
import { Oferta } from './Oferta';

@Entity()
export class Subasta {
  @PrimaryKey()
  id!: number;

  @Property()
  fechaInicio!: Date;

  @Property()
  fechaFin!: Date;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  precioActual!: number;

  @Property()
  activa: boolean = true;

  // Relaciones
  @ManyToOne(() => Camiseta)
  camiseta!: Camiseta;

  @ManyToOne(() => Usuario, { nullable: true })
  ganador?: Usuario;

  @OneToMany('Oferta', 'subasta')
  ofertas = new Collection<Oferta>(this);

  constructor(camiseta: Camiseta, fechaInicio: Date, fechaFin: Date, precioActual?: number) {
    this.camiseta = camiseta;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.precioActual = precioActual || camiseta.precioInicial;
  }

  // Método para verificar si la subasta está activa
  estaActiva(): boolean {
    const ahora = new Date();
    return this.activa && ahora >= this.fechaInicio && ahora <= this.fechaFin;
  }

  // Método para verificar si la subasta ha terminado
  haTerminado(): boolean {
    const ahora = new Date();
    return !this.activa || ahora > this.fechaFin;
  }
}
