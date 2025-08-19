import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Compra } from './Compra';

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  REEMBOLSADO = 'reembolsado'
}

export enum MetodoPago {
  TARJETA_CREDITO = 'tarjeta_credito',
  TARJETA_DEBITO = 'tarjeta_debito',
  PAYPAL = 'paypal',
  TRANSFERENCIA_BANCARIA = 'transferencia_bancaria',
  EFECTIVO = 'efectivo'
}

@Entity()
export class Pago {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  monto!: number;

  @Enum (() => MetodoPago)
  metodoPago: MetodoPago
 
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
