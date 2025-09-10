import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Usuario, UsuarioRol } from '../entities/Usuario.js';  // ✅ CORREGIDO: Agregar .js y UsuarioRol

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
        message: 'Error al obtener usuarios',
        error: error instanceof Error ? error.message : String(error)
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
      
      // ✅ PERFECTO: Validaciones completas de todos los campos obligatorios
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        });
      }
      
      if (!apellido) {
        return res.status(400).json({
          success: false,
          message: 'El apellido es obligatorio'
        });
      }
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El email es obligatorio'
        });
      }
      
      if (!contrasena) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña es obligatoria'
        });
      }
      
      if (!direccion) {
        return res.status(400).json({
          success: false,
          message: 'La dirección es obligatoria'
        });
      }
      
      if (!telefono) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono es obligatorio'
        });
      }

      // Validaciones adicionales
      if (nombre.length < 2 || apellido.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y apellido deben tener al menos 2 caracteres'
        });
      }

      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del email no es válido'
        });
      }

      if (contrasena.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // ✅ MEJORADO: Validar rol si se proporciona
      if (rol && !Object.values(UsuarioRol).includes(rol)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles permitidos: ${Object.values(UsuarioRol).join(', ')}`
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

      // ✅ PERFECTO: Constructor perfectamente alineado
      const nuevoUsuario = new Usuario(
        nombre,
        apellido,
        email,
        contrasena,
        direccion,
        telefono,
        rol as UsuarioRol || UsuarioRol.USUARIO  // ✅ MEJORADO: Cast al enum
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
      const { nombre, apellido, email, direccion, telefono, rol } = req.body;  // ✅ AGREGAR: rol
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const usuario = await em.findOne(Usuario, { id: parseInt(id), activo: true });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // ✅ MEJORADO: Validaciones en update
      if (email && email !== usuario.email) {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'El formato del email no es válido'
          });
        }

        // Verificar que el nuevo email no exista
        const existeOtro = await em.findOne(Usuario, { 
          email, 
          id: { $ne: parseInt(id) } 
        });
        if (existeOtro) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro usuario con ese email'
          });
        }
      }

      // ✅ AGREGAR: Validar rol si se proporciona
      if (rol && !Object.values(UsuarioRol).includes(rol)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles permitidos: ${Object.values(UsuarioRol).join(', ')}`
        });
      }

      // Actualizar solo los campos enviados
      if (nombre) usuario.nombre = nombre;
      if (apellido) usuario.apellido = apellido;
      if (email) usuario.email = email;
      if (direccion) usuario.direccion = direccion;
      if (telefono) usuario.telefono = telefono;
      if (rol) usuario.rol = rol as UsuarioRol;  // ✅ AGREGAR: Actualizar rol

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

  // DELETE /api/usuarios/:id (soft delete) - ✅ PERFECTO
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