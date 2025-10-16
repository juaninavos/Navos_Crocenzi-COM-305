import { Router } from 'express';
import { CamisetaController } from '../controllers/CamisetaController';
import authMiddleware from '../middleware/auth';

const router = Router();

// ✅ CONECTAR MÉTODOS ESTÁTICOS
router.get('/', CamisetaController.getAll);                    // GET /api/camisetas
router.get('/:id', CamisetaController.getOne);                 // GET /api/camisetas/:id
router.post('/', authMiddleware(), CamisetaController.create);  // POST /api/camisetas
router.post('/publicar', authMiddleware(), CamisetaController.publicarParaVenta); // POST /api/camisetas/publicar
router.put('/:id', authMiddleware(), CamisetaController.update); // PUT /api/camisetas/:id
router.delete('/:id', authMiddleware(), CamisetaController.delete); // DELETE /api/camisetas/:id

export default router;