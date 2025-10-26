import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Usuario, UsuarioRol } from '../entities/Usuario';
import { MikroORM } from '@mikro-orm/core';

const authRouter = (orm: MikroORM): Router => {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const registerSchema = z.object({
        nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
        apellido: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
        email: z.string().email('Email inválido'),
        contrasena: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
        direccion: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
        telefono: z.string().min(8, 'Teléfono debe tener al menos 8 caracteres')
      });

      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          errors: parseResult.error.issues
        });
      }

      const { nombre, apellido, email, contrasena, direccion, telefono } = parseResult.data;
      const em = orm.em.fork();

      const usuarioExistente = await em.findOne(Usuario, { 
        email_normalized: email.toLowerCase().trim() 
      });

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(contrasena, 10);

      const nuevoUsuario = new Usuario(
        nombre,
        apellido,
        email,
        hashedPassword,
        direccion,
        telefono,
        UsuarioRol.USUARIO
      );

      await em.persistAndFlush(nuevoUsuario);

      // ✅ SIN JWT: Solo devolver usuario
      const { contrasena: _, ...usuarioSinPassword } = nuevoUsuario;

      res.status(201).json({
        success: true,
        data: {
          usuario: usuarioSinPassword,
          token: 'fake-token-for-development' // ✅ Token fake para desarrollo
        },
        message: 'Usuario registrado correctamente'
      });

    } catch (error) {
      console.error('Error en register:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario'
      });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        email: z.string().email('Email inválido'),
        contrasena: z.string().min(1, 'Contraseña requerida')
      });

      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          errors: parseResult.error.issues
        });
      }

      const { email, contrasena } = parseResult.data;
      const em = orm.em.fork();

      const usuario = await em.findOne(Usuario, { 
        email_normalized: email.toLowerCase().trim(),
        activo: true
      });

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);

      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // ✅ SIN JWT: Solo devolver usuario
      const { contrasena: _, ...usuarioSinPassword } = usuario;

      res.json({
        success: true,
        data: {
          usuario: usuarioSinPassword,
          token: 'fake-token-for-development' // ✅ Token fake para desarrollo
        },
        message: 'Login exitoso'
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión'
      });
    }
  });

  return router;
};

export default authRouter;
