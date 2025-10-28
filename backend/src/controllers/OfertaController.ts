import { Request, Response } from 'express';
import { Oferta } from '../entities/Oferta';
import { Usuario } from '../entities/Usuario';
import { Subasta } from '../entities/Subasta';

export class OfertaController {
  // GET /api/ofertas
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const em = orm.em.fork(); // ✅ AGREGAR fork()
      
      const { subastaId, usuarioId } = req.query;
      
      const where: any = {};
      
      // Filtro por subasta
      if (subastaId) {
        where.subasta = parseInt(subastaId as string);
      }
      
      // Filtro por usuario
      if (usuarioId) {
        where.usuario = parseInt(usuarioId as string);
      }
      
      const ofertas = await em.find(Oferta, where, { 
        populate: ['usuario', 'subasta', 'subasta.camiseta'],
        orderBy: { fechaOferta: 'DESC' }
      });
      
      res.json({
        success: true,
        data: ofertas,
        count: ofertas.length,
        message: 'Ofertas obtenidas correctamente'
      });
    } catch (error) {
      console.error('❌ Error en getAll ofertas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ofertas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/ofertas/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const em = orm.em.fork(); // ✅ AGREGAR fork()
      
      const oferta = await em.findOne(Oferta, { id: parseInt(id) }, { 
        populate: ['usuario', 'subasta', 'subasta.camiseta'] 
      });
      
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      res.json({
        success: true,
        data: oferta,
        message: 'Oferta obtenida correctamente'
      });
    } catch (error) {
      console.error('❌ Error en getById oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener oferta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/ofertas
  static async create(req: Request, res: Response) {
    try {
      const { monto, usuarioId, subastaId } = req.body;
      
      // Validaciones básicas
      if (!monto || monto <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }
      
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario es obligatorio'
        });
      }
      
      if (!subastaId) {
        return res.status(400).json({
          success: false,
          message: 'La subasta es obligatoria'
        });
      }

      const orm = req.app.locals.orm;
      const em = orm.em.fork(); // ✅ AGREGAR fork()
      
      // Verificar que el usuario existe
      const usuario = await em.findOne(Usuario, { id: usuarioId });
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar que la subasta existe y está activa
      const subasta = await em.findOne(Subasta, { id: subastaId });
      if (!subasta) {
        return res.status(404).json({
          success: false,
          message: 'Subasta no encontrada'
        });
      }
      
      if (subasta.fechaFin < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La subasta ya ha finalizado'
        });
      }

      // Verificar que la oferta sea mayor a la actual
      if (monto <= subasta.precioActual) {
        return res.status(400).json({
          success: false,
          message: `La oferta debe ser mayor al precio actual ($${subasta.precioActual})`
        });
      }

      const nuevaOferta = new Oferta(subasta, usuario, monto);

      // Actualizar precio actual de la subasta
      subasta.precioActual = monto;

      await em.persistAndFlush([nuevaOferta, subasta]);

      // Populate para devolver datos completos
      await em.populate(nuevaOferta, ['usuario', 'subasta', 'subasta.camiseta']);

      res.status(201).json({
        success: true,
        data: nuevaOferta,
        message: 'Oferta creada correctamente'
      });
    } catch (error) {
      console.error('❌ Error en create oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear oferta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/ofertas/:id
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { monto } = req.body;
      
      const orm = req.app.locals.orm;
      const em = orm.em.fork(); // ✅ AGREGAR fork()
      
      const oferta = await em.findOne(Oferta, { id: parseInt(id) });
      
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      if (monto && monto > 0) {
        oferta.monto = monto;
      }

      await em.persistAndFlush(oferta);

      res.json({
        success: true,
        data: oferta,
        message: 'Oferta actualizada correctamente'
      });
    } catch (error) {
      console.error('❌ Error en update oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar oferta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // DELETE /api/ofertas/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const em = orm.em.fork(); // ✅ AGREGAR fork()
      
      const oferta = await em.findOne(Oferta, { id: parseInt(id) });
      
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      await em.removeAndFlush(oferta);

      res.json({
        success: true,
        message: 'Oferta eliminada correctamente'
      });
    } catch (error) {
      console.error('❌ Error en delete oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar oferta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}