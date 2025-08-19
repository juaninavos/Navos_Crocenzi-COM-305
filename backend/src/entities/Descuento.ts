import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';

export enum TipoDescuento {
  PORCENTAJE = 'porcentaje',
  MONTO_FIJO = 'monto_fijo'
}

@Entity()
export class Descuento {
  @PrimaryKey()
  id!: number;

  @Property()
  nombre!: string;

  @Property()
  codigo!: string;

  @Property({ type: 'text' })
  descripcion!: string;

  @Enum(() => TipoDescuento)
  tipo!: TipoDescuento;

  @Property({ type: 'decimal', precision: 8, scale: 2 })
  valor!: number; // Si es porcentaje: valor entre 0-100, si es monto fijo: valor absoluto

  @Property()
  fechaInicio!: Date;

  @Property()
  fechaFin!: Date;

  @Property()
  usosMaximos: number = 1;

  @Property()
  usosActuales: number = 0;

  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  montoMinimo?: number; // Monto mínimo de compra para aplicar el descuento

  @Property()
  activo: boolean = true;

  constructor(nombre: string, codigo: string, descripcion: string, tipo: TipoDescuento, valor: number, fechaInicio: Date, fechaFin: Date, usosMaximos: number = 1) {
    this.nombre = nombre;
    this.codigo = codigo;
    this.descripcion = descripcion;
    this.tipo = tipo;
    this.valor = valor;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.usosMaximos = usosMaximos;
  }

  // Método para verificar si el descuento está vigente
  estaVigente(): boolean {
    const ahora = new Date();
    return this.activo && 
           ahora >= this.fechaInicio && 
           ahora <= this.fechaFin && 
           this.usosActuales < this.usosMaximos;
  }

  // Método para calcular el descuento sobre un monto
  calcularDescuento(monto: number): number {
    if (!this.estaVigente()) return 0;
    if (this.montoMinimo && monto < this.montoMinimo) return 0;

    if (this.tipo === TipoDescuento.PORCENTAJE) {
      return (monto * this.valor) / 100;
    } else {
      return Math.min(this.valor, monto); // No puede ser mayor al monto total
    }
  }

  // Método para usar el descuento
  usar(): void {
    this.usosActuales++;
  }
}
