import { Entity, PrimaryKey, ManyToOne, Property } from '@mikro-orm/core';
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
  cantidad: number = 1;
}