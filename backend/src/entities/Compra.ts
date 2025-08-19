import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Camiseta } from './Camiseta';
import { Usuario } from './Usuario';
import { Pago } from './Pago';

export enum EstadoCompra {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  ENVIADA = 'enviada',
  ENTREGADA = 'entregada',
  CANCELADA = 'cancelada'
}

@Entity()
export class Compra {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  precioFinal!: number;

  @Property()
  cantidad: number = 1;

  @Enum(() => EstadoCompra)
  estado: EstadoCompra = EstadoCompra.PENDIENTE;

  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
  fechaCompra!: Date;

  @Property({ nullable: true })
  fechaEnvio?: Date;

  @Property({ nullable: true })
  fechaEntrega?: Date;

  @Property({ nullable: true })
  numeroSeguimiento?: string;

  // Relaciones
  @ManyToOne(() => Camiseta)
  camiseta!: Camiseta;

  @ManyToOne(() => Usuario)
  comprador!: Usuario;

  @OneToMany('pago', 'compra')
  pagos = new Collection<Pago>(this);

  constructor(camiseta: Camiseta, comprador: Usuario, precioFinal: number, cantidad: number = 1) {
    this.camiseta = camiseta;
    this.comprador = comprador;
    this.precioFinal = precioFinal;
    this.cantidad = cantidad;
  }

  // Método para calcular el total con descuentos si aplican
  calcularTotal(): number {
    return this.precioFinal * this.cantidad;
  }

  // Método para marcar como pagada
  marcarComoPagada(): void {
    this.estado = EstadoCompra.PAGADA;
  }

  // Método para marcar como enviada
  marcarComoEnviada(numeroSeguimiento?: string): void {
    this.estado = EstadoCompra.ENVIADA;
    this.fechaEnvio = new Date();
    if (numeroSeguimiento) {
      this.numeroSeguimiento = numeroSeguimiento;
    }
  }
}
