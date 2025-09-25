import express from 'express';
import { SubastaController } from '../controllers/SubastaController';

const router: express.Router = express.Router();

router.get('/', SubastaController.getAll);
router.get('/:id', SubastaController.getById);
router.post('/', SubastaController.create);
router.put('/:id/finalizar', SubastaController.finalizar);  // ✅ AGREGAR

export default router;