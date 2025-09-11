import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';

const router = Router();

// Todas las rutas requieren autenticación y rol de administrador
router.get('/dashboard', AdminController.getDashboard);
router.get('/usuarios', AdminController.gestionarUsuarios);
router.put('/usuarios/:id/toggle-estado', AdminController.toggleEstadoUsuario);
router.get('/reportes/ventas', AdminController.reporteVentas);

export default router;