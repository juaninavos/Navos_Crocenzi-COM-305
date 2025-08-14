import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';

@Entity()
export class MetodoPago {
  @PrimaryKey()
  id!: number;

  @Property()
  nombre!: string;

  @Property()
  descripcion!: string;

  @Property()
  activo: boolean = true;

  // Relaciones
  @OneToMany('Pago', 'metodoPago')
  pagos = new Collection<any>(this);

  constructor(nombre: string, descripcion: string) {
    this.nombre = nombre;
    this.descripcion = descripcion;
  }
}
