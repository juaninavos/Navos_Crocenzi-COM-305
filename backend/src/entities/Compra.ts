import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Usuario } from './Usuario';
import { Camiseta } from './Camiseta';
import { MetodoPago } from './MetodoPago';
import { Pago } from './Pago';  // ← Asegúrate de importar Pago

export enum EstadoCompra {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  PAGADA = 'pagada',
  ENVIADA = 'enviada',
  ENTREGADA = 'entregada',
  CANCELADA = 'cancelada'
}

@Entity()
export class Compra {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Enum(() => EstadoCompra)
  estado: EstadoCompra = EstadoCompra.PENDIENTE;

  @Property()
  fechaCompra: Date = new Date();

  @Property({ nullable: true })
  direccionEnvio?: string;

  @Property({ type: 'text', nullable: true })
  notas?: string;

  @ManyToOne('Usuario')
  comprador!: Usuario;

  @ManyToOne('Camiseta')
  camiseta!: Camiseta;

  @ManyToOne('MetodoPago')
  metodoPago!: MetodoPago;

  // Esta es la línea que está causando el problema
  @OneToMany(() => Pago, pago => pago.compra)  // ← Cambiar la sintaxis
  pagos = new Collection<Pago>(this);

  constructor(
    total: number,
    compradorId: number,
    camisetaId: number,
    metodoPagoId: number,
    direccionEnvio?: string
  ) {
    this.total = total;
    this.comprador = compradorId as any;
    this.camiseta = camisetaId as any;
    this.metodoPago = metodoPagoId as any;
    this.direccionEnvio = direccionEnvio;
  }
}
