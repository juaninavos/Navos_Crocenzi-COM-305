import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';

@Entity()
export class Categoria {
  @PrimaryKey()
  id!: number;

  @Property()
  nombre!: string;

  @Property({ nullable: true })
  descripcion?: string;

  @Property()
  activa: boolean = true;

  // Relaciones
  @OneToMany('Camiseta', 'categoria')
  camisetas = new Collection<any>(this);

  constructor(nombre: string, descripcion?: string) {
    this.nombre = nombre;
    this.descripcion = descripcion;
  }
}
