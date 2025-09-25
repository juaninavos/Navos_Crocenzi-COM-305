import express, { Request, Response, Router, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Usuario, UsuarioRol } from '../entities/Usuario'; // ✅ Importar UsuarioRol


import { AuthUser } from '../types/auth';

const router: Router = express.Router();

// --- Configuración / validaciones iniciales ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado. Define la variable de entorno JWT_SECRET y reinicia la aplicación.');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'mi-app';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || '10'); // ✅ Cambiar nombre
const JWT_USE_COOKIE = process.env.JWT_USE_COOKIE === 'true';
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'token';

const ALLOWED_ROLES = ['usuario', 'administrador'];

function isValidRol(rol: string): boolean {
  return ALLOWED_ROLES.includes(rol);
}

function createToken(payload: object, subject?: string) {
  const opts: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    subject: subject,
    algorithm: 'HS256' as SignOptions['algorithm'],
  } as SignOptions;
  return jwt.sign(payload as any, JWT_SECRET as string, opts);
}

// --- Helpers simples de validación / sanitización ---
function isValidEmail(v: any): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function sanitizeString(v: any): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
}

// --- Middleware exportable para proteger rutas ---

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = (req.headers.authorization || '') as string;
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'token requerido' });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as any;
    const id = typeof payload.id === 'number' ? payload.id : Number(payload.id ?? payload.sub);
    req.user = { id, rol: payload.rol, email: payload.email || '' } as AuthUser;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'token invalido' });
  }
}

export default function authRouter(orm: MikroORM): Router {
  // Registro
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const em = orm.em.fork();
      
      // Sanitizar y validar input
      const nombre = sanitizeString(req.body.nombre);
      const apellido = sanitizeString(req.body.apellido);
      const emailRaw = sanitizeString(req.body.email);
      const contrasenaRaw = sanitizeString(req.body.contrasena);
      const direccion = sanitizeString(req.body.direccion);
      const telefono = sanitizeString(req.body.telefono);
      const rolRaw = sanitizeString(req.body.rol);

      console.log('🔍 REGISTER ATTEMPT:', { 
        nombre, 
        apellido,
        email: emailRaw, 
        contrasena: contrasenaRaw ? '***' : 'undefined',
        direccion,
        telefono,
        rol: rolRaw
      });

      // VALIDACIONES MEJORADAS
      if (!nombre || !apellido || !emailRaw || !contrasenaRaw || !direccion || !telefono) {
        console.log('❌ Faltan campos requeridos');
        return res.status(400).json({ 
          success: false,
          error: 'Todos los campos son requeridos' 
        });
      }

      const email = emailRaw.toLowerCase();
      const email_normalized = email.toLowerCase().trim();

      if (!isValidEmail(email)) {
        console.log('❌ Email inválido');
        return res.status(400).json({ 
          success: false,
          error: 'Email inválido' 
        });
      }

      // CAMBIAR VALIDACIÓN DE CONTRASEÑA (mínimo 6 caracteres)
      if (contrasenaRaw.length < 6) {
        console.log('❌ Contraseña muy corta');
        return res.status(400).json({ 
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      // ROL DEFAULT CORRECTO
      const rol = (rolRaw && isValidRol(rolRaw)) ? rolRaw : UsuarioRol.USUARIO;

      // Verificar si usuario ya existe
      const existingUser = await em.findOne(Usuario, { email_normalized });
      if (existingUser) {
        console.log('❌ Usuario ya existe');
        return res.status(409).json({ 
          success: false,
          error: 'El usuario ya existe' 
        });
      }

      // HASHEAR CONTRASEÑA CON VARIABLE CORRECTA
      console.log('🔐 Hasheando contraseña...');
      const hashed = await bcrypt.hash(contrasenaRaw, saltRounds); // ✅ saltRounds
      console.log('✅ Contraseña hasheada correctamente');

      // CREAR USUARIO CON CONSTRUCTOR
      console.log('👤 Creando usuario...');
      const user = new Usuario(
        nombre,
        apellido,
        email,
        hashed, // ✅ Contraseña hasheada
        direccion,
        telefono,
        rol as UsuarioRol
      );

      try {
        await em.persistAndFlush(user);
        console.log('✅ Usuario creado exitosamente');
      } catch (e: any) {
        console.error('❌ Error al persistir usuario:', e);
        
        if (e.code === 'ER_DUP_ENTRY' || e.name === 'UniqueConstraintViolationException') {
          return res.status(409).json({ 
            success: false,
            error: 'El usuario ya existe' 
          });
        }
        return res.status(500).json({ 
          success: false,
          error: 'Error interno' 
        });
      }

      if (!user.id || typeof user.id !== 'number') {
        console.log('❌ Error con ID de usuario');
        return res.status(500).json({ 
          success: false,
          error: 'Error interno' 
        });
      }

      // Serializar el usuario de forma segura
      const safeUser = wrap(user).toObject();
      delete (safeUser as any).contrasena;

      const token = createToken({ id: user.id, rol: user.rol }, String(user.id));

      if (JWT_USE_COOKIE) {
        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }

      console.log('✅ Register completado exitosamente');

      return res.status(201).json({ 
        success: true,
        data: {
          usuario: safeUser, 
          token 
        }
      });
      
    } catch (err) {
      console.error('POST /auth/register error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Error interno' 
      });
    }
  });

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const em = orm.em.fork();
      const emailRaw = sanitizeString(req.body.email);
      const contrasenaRaw = sanitizeString(req.body.contrasena);
      
      console.log('🔍 LOGIN ATTEMPT:', { email: emailRaw, contrasena: '***' });

      if (!emailRaw || !contrasenaRaw) {
        return res.status(400).json({ 
          success: false,
          error: 'Email y contraseña son requeridos' 
        });
      }
      
      const email = emailRaw.toLowerCase();
      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Email inválido' 
        });
      }

      const user = await em.findOne(Usuario, { email_normalized: email });
      console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
      
      if (!user) {
        console.log('❌ Usuario no existe');
        return res.status(401).json({ 
          success: false,
          error: 'Credenciales inválidas' 
        });
      }

      const hashed = user.contrasena;
      const ok = await bcrypt.compare(contrasenaRaw, hashed);
      console.log('🔐 Password válida:', ok);
      
      if (!ok) {
        console.log('❌ Password incorrecta');
        return res.status(401).json({ 
          success: false,
          error: 'Credenciales inválidas' 
        });
      }

      const token = createToken({ id: user.id, rol: user.rol }, String(user.id));

      const safeUser = wrap(user).toObject();
      delete (safeUser as any).contrasena;

      if (JWT_USE_COOKIE) {
        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }

      console.log('✅ Login exitoso para:', email);

      return res.json({ 
        success: true,
        data: {
          usuario: safeUser,
          token 
        }
      });
      
    } catch (err) {
      console.error('POST /auth/login error:', err);
      return res.status(500).json({ 
        success: false,
        error: (err instanceof Error) ? err.message : 'Error interno' 
      });
    }
  });

  return router;
}
