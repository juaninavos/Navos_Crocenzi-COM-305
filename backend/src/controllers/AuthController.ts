import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { MikroORM, wrap } from '@mikro-orm/core';
import { Usuario } from '../entities/Usuario';


import { AuthUser } from '../types/auth';

const router: Router = express.Router();

// --- Configuración / validaciones iniciales ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado. Define la variable de entorno JWT_SECRET y reinicia la aplicación.');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'mi-app';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || '10');
const JWT_USE_COOKIE = process.env.JWT_USE_COOKIE === 'true'; // opcional: si quieres setear el token como cookie HttpOnly
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'token';

const ALLOWED_ROLES = ['usuario', 'administrador']; // ajusta según tu dominio

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
export function authMiddleware(req: Request, res: Response, next: Function) {
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

      if (!emailRaw || !contrasenaRaw) return res.status(400).json({ error: 'email y contrasena requeridos' });
      const email = emailRaw.toLowerCase();

      if (!isValidEmail(email)) return res.status(400).json({ error: 'email invalido' });
      if (contrasenaRaw.length < 8) return res.status(400).json({ error: 'contrasena debe tener al menos 8 caracteres' });

      const rol = rolRaw ?? 'usuario';
      if (rol && !ALLOWED_ROLES.includes(rol)) return res.status(400).json({ error: 'rol invalido' });

      // Evitar duplicados (check optimista). La defensa definitiva debe ser un UNIQUE en la BD.
      const exist = await em.findOne(Usuario, { email });
      if (exist) return res.status(409).json({ error: 'usuario ya existe' });

      const hashed = await bcrypt.hash(contrasenaRaw, BCRYPT_SALT_ROUNDS);

      const user = em.create(Usuario, {nombre,apellido,email,contrasena: hashed,direccion,telefono,rol,} as any);

      try {
        await em.persistAndFlush(user);
      } catch (e: any) {
        // Manejo de constraint unique (Postgres: code === '23505', sqlite: message contiene 'UNIQUE')
        const msg = String(e?.message || '');
        if (e?.code === '23505' || /unique/i.test(msg) || /UNIQUE constraint failed/i.test(msg)) {
          return res.status(409).json({ error: 'usuario ya existe' });
        }
        throw e;
      }

      // Serializar el usuario de forma segura usando wrap().toObject()
      const safeUser = wrap(user).toObject();
      delete (safeUser as any).contrasena;

      const token = createToken({ id: (user as any).id, rol: (user as any).rol }, String((user as any).id));

      // Opcional: setear cookie HttpOnly si lo configuraste
      if (JWT_USE_COOKIE) {
        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('d')
            ? Number(JWT_EXPIRES_IN.slice(0, -1)) * 24 * 60 * 60 * 1000
            : undefined,
        });
      }

      return res.status(201).json({ user: safeUser, token });
    } catch (err) {
      console.error('POST /auth/register error:', err);
      return res.status(500).json({ error: (err instanceof Error) ? err.message : 'unknown' });
    }
  });

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const em = orm.em.fork();
      const emailRaw = sanitizeString(req.body.email);
      const contrasenaRaw = sanitizeString(req.body.contrasena);

      if (!emailRaw || !contrasenaRaw) return res.status(400).json({ error: 'email y contrasena requeridos' });
      const email = emailRaw.toLowerCase();

      if (!isValidEmail(email)) return res.status(400).json({ error: 'email invalido' });

      const user = await em.findOne(Usuario, { email });
      // No revelar si el usuario existe o no: responder igual para credenciales invalidas
      if (!user) return res.status(401).json({ error: 'credenciales invalidas' });

      const hashed = (user as any).contrasena;
      const ok = await bcrypt.compare(contrasenaRaw, hashed);
      if (!ok) return res.status(401).json({ error: 'credenciales invalidas' });

      const token = createToken({ id: (user as any).id, rol: (user as any).rol }, String((user as any).id));

      const safeUser = wrap(user).toObject();
      delete (safeUser as any).contrasena;

      if (JWT_USE_COOKIE) {
        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }

      return res.json({ user: safeUser, token });
    } catch (err) {
      console.error('POST /auth/login error:', err);
      return res.status(500).json({ error: (err instanceof Error) ? err.message : 'unknown' });
    }
  });

  return router;
}
