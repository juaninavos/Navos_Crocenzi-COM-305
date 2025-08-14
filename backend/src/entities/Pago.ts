import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Compra } from './Compra';
import { MetodoPago } from './MetodoPago';

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  REEMBOLSADO = 'reembolsado'
}

@Entity()
export class Pago {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Enum(() => EstadoPago)
  estado: EstadoPago = EstadoPago.PENDIENTE;

  @Property()
  fechaPago: Date = new Date();

  @Property({ nullable: true })
  transaccionId?: string;

  @Property({ nullable: true })
  detalles?: string;

  // Relaciones
  @ManyToOne(() => Compra)
  compra!: Compra;

  @ManyToOne(() => MetodoPago)
  metodoPago!: MetodoPago;

  constructor(compra: Compra, metodoPago: MetodoPago, monto: number) {
    this.compra = compra;
    this.metodoPago = metodoPago;
    this.monto = monto;
  }

  // Método para aprobar el pago
  aprobar(transaccionId?: string): void {
    this.estado = EstadoPago.APROBADO;
    if (transaccionId) {
      this.transaccionId = transaccionId;
    }
  }

  // Método para rechazar el pago
  rechazar(motivo?: string): void {
    this.estado = EstadoPago.RECHAZADO;
    if (motivo) {
      this.detalles = motivo;
    }
  }
}
