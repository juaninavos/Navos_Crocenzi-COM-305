import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Compra } from './Compra';
import { Camiseta } from './Camiseta';

@Entity()
export class CompraItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Compra)
  compra!: Compra;

  @ManyToOne(() => Camiseta)
  camiseta!: Camiseta;

  @Property()
  cantidad!: number;

  @Property({ onCreate: () => new Date() })
  fechaCreacion: Date = new Date();
}