import { Router } from 'express';
import { PagoController } from '../controllers/PagoController.js';

const router = Router();

router.get('/', PagoController.getAll);
router.get('/:id', PagoController.getById);
router.get('/compra/:compraId', PagoController.getByCompra);
router.post('/', PagoController.create);
router.put('/:id/confirmar', PagoController.confirmar);
router.put('/:id/rechazar', PagoController.rechazar);

export default router;