import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const router = Router();

// 🎯 CRUD básico para REGULARIDAD
router.get('/', UsuarioController.getAll);        // GET /api/usuarios
router.get('/:id', UsuarioController.getOne);     // GET /api/usuarios/1
router.post('/', UsuarioController.create);       // POST /api/usuarios
router.put('/:id', UsuarioController.update);     // PUT /api/usuarios/1
router.delete('/:id', UsuarioController.delete);  // DELETE /api/usuarios/1

export default router;