import express from 'express';
import { DescuentoController } from '../controllers/DescuentoController';

const router: express.Router = express.Router();

router.get('/', DescuentoController.getAll);
router.get('/:id', DescuentoController.getById);
router.get('/validar/:codigo', DescuentoController.validarCodigo);
router.post('/', DescuentoController.create);
router.put('/:id', DescuentoController.update);
router.delete('/:id', DescuentoController.delete);

export default router;