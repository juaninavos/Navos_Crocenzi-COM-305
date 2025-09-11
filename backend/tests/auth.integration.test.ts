import request from 'supertest';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import express from 'express';
import authRouter from '../src/controllers/AuthController';
import authMiddleware from '../src/middleware/auth';
import roleGuard from '../src/middleware/roleGuard';

describe('auth integration', () => {
  let app: express.Express;
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(config as any);
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter(orm as any));
    app.get('/api/protegida/admin', authMiddleware(), roleGuard(['administrador']), (req, res) => res.json({ ok: true }));
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('register -> login -> access protected', async () => {
    const email = `test${Date.now()}@example.com`;
    const registerRes = await request(app).post('/api/auth/register').send({ nombre: 'T', apellido: 'U', email, contrasena: '123456' });
    expect(registerRes.status).toBe(201);
    const loginRes = await request(app).post('/api/auth/login').send({ email, contrasena: '123456' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;
    const prot = await request(app).get('/api/protegida/admin').set('Authorization', `Bearer ${token}`);
    // user default role is 'usuario' so should be 403
    expect([401, 403]).toContain(prot.status);
  }, 20000);
});
