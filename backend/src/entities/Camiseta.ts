import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Camiseta {
  @PrimaryKey()
  id!: number;

  @Property()
  marca!: string;

  @Property()
  modelo!: string;

  @Property()
  talle!: string;

  @Property()
  precio!: number;
}

