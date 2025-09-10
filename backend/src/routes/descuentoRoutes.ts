import { Router } from 'express';
import { DescuentoController } from '../controllers/DescuentoController.js';

const router = Router();

router.get('/', DescuentoController.getAll);
router.get('/:id', DescuentoController.getById);
router.get('/validar/:codigo', DescuentoController.validarCodigo);
router.post('/', DescuentoController.create);
router.put('/:id', DescuentoController.update);
router.delete('/:id', DescuentoController.delete);

export default router;