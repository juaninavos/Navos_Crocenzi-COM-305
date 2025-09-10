import { Router } from 'express';
import { SubastaController } from '../controllers/SubastaController.js';

const router = Router();

router.get('/', SubastaController.getAll);
router.get('/:id', SubastaController.getById);
router.post('/', SubastaController.create);
router.put('/:id/finalizar', SubastaController.finalizar);  // ✅ AGREGAR

export default router;