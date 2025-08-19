import { Entity, PrimaryKey, Property, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Camiseta } from './Camiseta';
import { Compra } from './Compra';
import { Oferta } from './Oferta';

export enum UsuarioRol {
  USUARIO = 'usuario',
  ADMINISTRADOR = 'administrador'
}

@Entity()
export class Usuario {
  @PrimaryKey()
  id!: number;

  @Property()
  nombre!: string;

  @Property()
  apellido!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  contrasena!: string;

  @Property()
  direccion!: string;

  @Property()
  telefono!: string;

  @Enum(() => UsuarioRol)
  rol: UsuarioRol = UsuarioRol.USUARIO;

  @Property()
  activo: boolean = true;

  @Property()
  fechaRegistro: Date = new Date();

  // Relaciones
  @OneToMany('Oferta', 'usuario')
  ofertas = new Collection<Oferta>(this);

  @OneToMany('Compra', 'comprador')
  compras = new Collection<Compra>(this);

  @OneToMany('Camiseta', 'vendedor')
  camisetasVendidas = new Collection<Camiseta>(this);

  constructor(nombre: string, apellido: string, email: string, contrasena: string, direccion: string, telefono: string, rol: UsuarioRol = UsuarioRol.USUARIO) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.contrasena = contrasena;
    this.direccion = direccion;
    this.telefono = telefono;
    this.rol = rol;
  }
}
