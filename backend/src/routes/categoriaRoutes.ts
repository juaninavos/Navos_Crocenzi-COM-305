import { Router } from 'express';
import { CategoriaController } from '../controllers/CategoriaController';

const router = Router();

// Rutas para categorías
router.get('/', CategoriaController.getAll);
router.get('/:id', CategoriaController.getOne);
router.post('/', CategoriaController.create);
router.put('/:id', CategoriaController.update);
router.delete('/:id', CategoriaController.delete);

export default router;
