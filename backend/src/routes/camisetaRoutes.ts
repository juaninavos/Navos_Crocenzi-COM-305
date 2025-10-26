import { Router } from 'express';
import { CamisetaController } from '../controllers/CamisetaController';
import authMiddleware from '../middleware/auth';

const router = Router();

// 🎯 CRUD básico + filtros para REGULARIDAD
router.get('/', CamisetaController.getAll);
router.get('/stats', CamisetaController.stats); // ✅ AGREGAR antes de /:id
router.get('/:id', CamisetaController.getOne);
router.post('/', CamisetaController.create);
router.put('/:id', CamisetaController.update);
router.delete('/:id', CamisetaController.delete);

// 🚀 CASO DE USO para REGULARIDAD
router.post('/publicar', authMiddleware, CamisetaController.publicarParaVenta);

export default router;
