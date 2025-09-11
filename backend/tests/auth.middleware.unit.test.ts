import authMiddleware from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

describe('auth middleware (unit)', () => {
  test('attaches user on valid token and calls next', () => {
    const secret = 'test-secret-mw';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: 42, rol: 'usuario', email: 'u@example.com' } as any, secret);

    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const mw = authMiddleware();
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe(42);
    expect((req as any).user.rol).toBe('usuario');
  });

  test('responds 401 on missing or invalid token', () => {
    const req: any = { headers: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const mw = authMiddleware();
    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
