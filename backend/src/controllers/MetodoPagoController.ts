import { Request, Response } from 'express';
import { MetodoPago } from '../entities/MetodoPago.js';

export class MetodoPagoController {
  // GET /api/metodos-pago
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const { activos } = req.query;
      
      let filtros: any = {};
      if (activos === 'true') {
        filtros.activo = true;
      }
      
      const metodosPago = await orm.em.find(MetodoPago, filtros);
      
      res.json({
        success: true,
        data: metodosPago,
        count: metodosPago.length,
        message: 'Métodos de pago obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en getAll métodos pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener métodos de pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/metodos-pago/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const metodoPago = await orm.em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: metodoPago,
        message: 'Método de pago obtenido correctamente'
      });
    } catch (error) {
      console.error('Error en getById método pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener método de pago',
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
          message: 'El nombre es obligatorio'
        });
      }
      
      if (!descripcion) {
        return res.status(400).json({
          success: false,
          message: 'La descripción es obligatoria'
        });
      }

      const orm = req.app.locals.orm;
      
      // Verificar que no exista un método con el mismo nombre
      const existeMetodo = await orm.em.findOne(MetodoPago, { nombre });
      if (existeMetodo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un método de pago con ese nombre'
        });
      }

      const nuevoMetodo = new MetodoPago(nombre, descripcion);
      await orm.em.persistAndFlush(nuevoMetodo);

      res.status(201).json({
        success: true,
        data: nuevoMetodo,
        message: 'Método de pago creado correctamente'
      });
    } catch (error) {
      console.error('Error en create método pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear método de pago',
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
      const metodoPago = await orm.em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }

      if (nombre) metodoPago.nombre = nombre;
      if (descripcion) metodoPago.descripcion = descripcion;
      if (activo !== undefined) metodoPago.activo = activo;

      await orm.em.persistAndFlush(metodoPago);

      res.json({
        success: true,
        data: metodoPago,
        message: 'Método de pago actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en update método pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar método de pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // DELETE /api/metodos-pago/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const metodoPago = await orm.em.findOne(MetodoPago, { id: parseInt(id) });
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }

      // Soft delete
      metodoPago.activo = false;
      await orm.em.persistAndFlush(metodoPago);

      res.json({
        success: true,
        message: 'Método de pago desactivado correctamente'
      });
    } catch (error) {
      console.error('Error en delete método pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar método de pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}