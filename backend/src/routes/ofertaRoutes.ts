import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';

const router = Router();

router.get('/', OfertaController.getAll);
router.get('/:id', OfertaController.getById);
router.post('/', OfertaController.create);
router.put('/:id', OfertaController.update);
router.delete('/:id', OfertaController.delete);

export default router;