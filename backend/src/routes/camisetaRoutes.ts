import express from 'express';
import { CamisetaController } from '../controllers/CamisetaController';

const router: express.Router = express.Router();

// 🎯 CRUD básico + filtros para REGULARIDAD
router.get('/', CamisetaController.getAll);        // GET /api/camisetas?equipo=Argentina
router.get('/:id', CamisetaController.getOne);     // GET /api/camisetas/1
router.post('/', CamisetaController.create);       // POST /api/camisetas
router.put('/:id', CamisetaController.update);     // PUT /api/camisetas/1
router.delete('/:id', CamisetaController.delete);  // DELETE /api/camisetas/1

// 🚀 CASO DE USO para REGULARIDAD
router.post('/publicar', CamisetaController.publicarParaVenta);  // POST /api/camisetas/publicar

export default router;