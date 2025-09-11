import express from 'express';
import { CompraController } from '../controllers/CompraController.js';

const router: express.Router = express.Router();

router.get('/', CompraController.getAll);
router.get('/:id', CompraController.getById);
router.get('/usuario/:usuarioId', CompraController.getByUsuario);
router.post('/', CompraController.create);
router.put('/:id', CompraController.update);
router.delete('/:id', CompraController.delete);
router.post('/:id/confirmar', CompraController.confirmar); // ✅ AGREGAR ESTA LÍNEA

export default router;