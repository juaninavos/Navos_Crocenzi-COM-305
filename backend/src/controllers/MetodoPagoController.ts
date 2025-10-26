import { Request, Response } from 'express';
import { MetodoPago } from '../entities/MetodoPago';

export class MetodoPagoController {
  // GET /api/metodos-pago
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm; // ✅ Obtener orm de req.app.locals
      const em = orm.em.fork();
      const metodosPago = await em.find(MetodoPago, {});
      
      return res.json({
        success: true,
        data: metodosPago,
        count: metodosPago.length
      });
    } catch (error) {
      console.error('Error in MetodoPagoController.getAll:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // GET /api/metodos-pago/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const metodoPago = await em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          error: 'Método de pago no encontrado'
        });
      }

      return res.json({
        success: true,
        data: metodoPago
      });
    } catch (error) {
      console.error('Error en getById método pago:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/metodos-pago
  static async create(req: Request, res: Response) {
    try {
      const { nombre, descripcion } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es obligatorio'
        });
      }
      
      if (!descripcion) {
        return res.status(400).json({
          success: false,
          error: 'La descripción es obligatoria'
        });
      }

      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      // Verificar que no exista un método con el mismo nombre
      const existeMetodo = await em.findOne(MetodoPago, { nombre });
      if (existeMetodo) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un método de pago con ese nombre'
        });
      }

      const nuevoMetodo = em.create(MetodoPago, {
        nombre,
        descripcion,
        activo: true
      });
      
      await em.persistAndFlush(nuevoMetodo);

      return res.status(201).json({
        success: true,
        data: nuevoMetodo
      });
    } catch (error) {
      console.error('Error en create método pago:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/metodos-pago/:id
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;
      
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const metodoPago = await em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          error: 'Método de pago no encontrado'
        });
      }

      if (nombre !== undefined) metodoPago.nombre = nombre;
      if (descripcion !== undefined) metodoPago.descripcion = descripcion;
      if (activo !== undefined) metodoPago.activo = activo;

      await em.persistAndFlush(metodoPago);

      return res.json({
        success: true,
        data: metodoPago
      });
    } catch (error) {
      console.error('Error en update método pago:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // DELETE /api/metodos-pago/:id (Soft delete)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const metodoPago = await em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          error: 'Método de pago no encontrado'
        });
      }

      // Soft delete - solo desactivar
      metodoPago.activo = false;
      await em.persistAndFlush(metodoPago);

      return res.json({
        success: true,
        message: 'Método de pago desactivado correctamente'
      });
    } catch (error) {
      console.error('Error en delete método pago:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}