import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Usuario } from '../entities/Usuario';

export class UsuarioController {
  
  // GET /api/usuarios
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const usuarios = await em.find(Usuario, { activo: true });
      
      res.json({
        success: true,
        data: usuarios,
        count: usuarios.length,
        message: 'Usuarios obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en getAll usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  // GET /api/usuarios/:id
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const usuario = await em.findOne(Usuario, { id: parseInt(id), activo: true });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error en getOne usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario'
      });
    }
  }

  // POST /api/usuarios
  static async create(req: Request, res: Response) {
    try {
      const { nombre, apellido, email, contrasena, direccion, telefono, rol } = req.body;
      
      // Validaciones básicas
      if (!nombre || !apellido || !email || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: nombre, apellido, email, contraseña'
        });
      }

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      // Verificar que el email no exista
      const existeUsuario = await em.findOne(Usuario, { email });
      if (existeUsuario) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese email'
        });
      }

      const nuevoUsuario = new Usuario(
        nombre,
        apellido,
        email,
        contrasena,
        direccion,
        telefono,
        rol
      );

      em.persist(nuevoUsuario);
      await em.flush();

      res.status(201).json({
        success: true,
        data: nuevoUsuario,
        message: 'Usuario creado correctamente'
      });
    } catch (error) {
      console.error('Error en create usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario'
      });
    }
  }

  // PUT /api/usuarios/:id
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, direccion, telefono } = req.body;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const usuario = await em.findOne(Usuario, { id: parseInt(id), activo: true });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar solo los campos enviados
      if (nombre) usuario.nombre = nombre;
      if (apellido) usuario.apellido = apellido;
      if (email) usuario.email = email;
      if (direccion) usuario.direccion = direccion;
      if (telefono) usuario.telefono = telefono;

      await em.flush();

      res.json({
        success: true,
        data: usuario,
        message: 'Usuario actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en update usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario'
      });
    }
  }

  // DELETE /api/usuarios/:id (soft delete)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const usuario = await em.findOne(Usuario, { id: parseInt(id), activo: true });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Soft delete: marcar como inactivo en lugar de eliminar
      usuario.activo = false;
      await em.flush();

      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en delete usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario'
      });
    }
  }
}