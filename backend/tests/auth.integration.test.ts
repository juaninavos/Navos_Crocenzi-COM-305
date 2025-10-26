import request from 'supertest';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';

describe('Auth Integration Tests', () => {
  let orm: MikroORM;
  let app: any;

  beforeAll(async () => {
    orm = await MikroORM.init(config);
    // Aquí importarías tu app de Express configurada
    // app = createApp(orm);
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: 'test@example.com',
          contrasena: 'password123',
          direccion: 'Calle Test 123',
          telefono: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.usuario).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.usuario).not.toHaveProperty('contrasena');
    });

    it('debería rechazar email duplicado', async () => {
      // Registrar usuario
      await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: 'duplicate@example.com',
          contrasena: 'password123',
          direccion: 'Calle Test 123',
          telefono: '1234567890'
        });

      // Intentar registrar mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test2',
          apellido: 'User2',
          email: 'duplicate@example.com',
          contrasena: 'password123',
          direccion: 'Calle Test 456',
          telefono: '0987654321'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Login',
          apellido: 'Test',
          email: 'login@example.com',
          contrasena: 'password123',
          direccion: 'Calle Test 123',
          telefono: '1234567890'
        });
    });

    it('debería hacer login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          contrasena: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.usuario).toHaveProperty('email', 'login@example.com');
    });

    it('debería rechazar contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          contrasena: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
