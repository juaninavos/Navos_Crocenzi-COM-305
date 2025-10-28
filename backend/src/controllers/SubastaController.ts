import { Request, Response } from 'express';
import { Subasta } from '../entities/Subasta';
import { Camiseta, EstadoCamiseta } from '../entities/Camiseta';
import { z } from 'zod';

export class SubastaController {
  // GET /api/subastas
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const { activas, vendedorId } = req.query;
      
      console.log('📊 Obteniendo subastas con filtros:', { activas, vendedorId });
      
      const where: any = {};
      
      // Filtro por activas (fecha fin > ahora)
      if (activas === 'true') {
        where.fechaFin = { $gte: new Date() };
        where.activa = true;
      }
      
      // ✅ AGREGAR: Filtro por vendedor de la camiseta
      if (vendedorId) {
        where.camiseta = { vendedor: { id: parseInt(vendedorId as string) } };
      }
      
      const subastas = await em.find(Subasta, where, {
        populate: ['camiseta', 'camiseta.vendedor', 'camiseta.categoria', 'ganador']
      });
      
      console.log(`✅ Encontradas ${subastas.length} subastas`);
      
      res.json({
        success: true,
        data: subastas,
        count: subastas.length,
        page: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error('❌ Error en getAll subastas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subastas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/subastas/:id
  // ✅ CAMBIO: Renombrar de getOne a getById
  static async getById(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      const { id } = req.params;

      console.log('📊 Buscando subasta:', id);

      const subasta = await em.findOne(Subasta, { id: parseInt(id) });

      if (!subasta) {
        return res.status(404).json({
          success: false,
          message: 'Subasta no encontrada'
        });
      }

      // ✅ Populate manual con try/catch
      try {
        await em.populate(subasta, ['camiseta', 'camiseta.vendedor', 'camiseta.categoria']);
      } catch (populateError) {
        console.warn('⚠️ Error al popular categoria, continuando sin ella');
        await em.populate(subasta, ['camiseta', 'camiseta.vendedor']);
      }

      res.json({
        success: true,
        data: subasta
      });
    } catch (error) {
      console.error('❌ Error en getById subasta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subasta'
      });
    }
  }

  // POST /api/subastas
  static async create(req: Request, res: Response) {
    try {
      const createSubastaSchema = z.object({
        fechaInicio: z.coerce.date(),
        fechaFin: z.coerce.date(),
        camisetaId: z.coerce.number().int().positive(),
        precioInicial: z.coerce.number().positive().optional()
      }).refine(data => data.fechaFin > data.fechaInicio, {
        message: 'La fecha de fin debe ser posterior a la de inicio'
      });

      const parseResult = createSubastaSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          errors: parseResult.error.issues
        });
      }

      const { fechaInicio, fechaFin, camisetaId, precioInicial } = parseResult.data;
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const camiseta = await em.findOne(Camiseta, { id: camisetaId });
      if (!camiseta) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }

      if (camiseta.estado !== EstadoCamiseta.DISPONIBLE) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta no está disponible para subasta'
        });
      }

      const nuevaSubasta = new Subasta(
        fechaInicio,
        fechaFin,
        precioInicial || camiseta.precioInicial,
        camiseta
      );

      camiseta.estado = EstadoCamiseta.EN_SUBASTA;
      camiseta.esSubasta = true;

      await em.persistAndFlush([nuevaSubasta, camiseta]);

      const subastaCompleta = await em.findOne(Subasta, { id: nuevaSubasta.id });
      if (subastaCompleta) {
        await em.populate(subastaCompleta, ['camiseta', 'camiseta.vendedor']);
      }

      res.status(201).json({
        success: true,
        data: subastaCompleta,
        message: 'Subasta creada correctamente'
      });
    } catch (error) {
      console.error('Error en create subasta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear subasta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/subastas/:id/finalizar
  static async finalizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      
      const subasta = await em.findOne(Subasta, { id: parseInt(id) }, {
        populate: ['camiseta']
      });
      
      if (!subasta) {
        return res.status(404).json({
          success: false,
          message: 'Subasta no encontrada'
        });
      }

      if (!subasta.activa) {
        return res.status(400).json({
          success: false,
          message: 'La subasta ya está finalizada'
        });
      }

      if (subasta.fechaFin > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La subasta aún no ha terminado'
        });
      }

      // Finalizar subasta
      subasta.activa = false;
      
      // Si la camiseta no tiene ganador, volver a disponible
      if (!subasta.ganador) {
        if (subasta.camiseta) {
          subasta.camiseta.estado = EstadoCamiseta.DISPONIBLE;
        }
      }

      await em.persistAndFlush([subasta, subasta.camiseta]);

      res.json({
        success: true,
        data: subasta,
        message: 'Subasta finalizada correctamente'
      });
    } catch (error) {
      console.error('Error en finalizar subasta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al finalizar subasta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/subastas/camiseta/:camisetaId
  static async getByCamiseta(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const em = orm.em.fork();
      const { camisetaId } = req.params;

      console.log('🔍 Buscando subasta para camiseta:', camisetaId);

      // ✅ CORREGIR: Buscar con query builder para evitar error de relación
      const subasta = await em.findOne(Subasta, 
        { camiseta: { id: parseInt(camisetaId) } }, // ✅ CAMBIO: agregar .id
        { populate: ['camiseta'] }
      );

      if (!subasta) {
        console.log('❌ No se encontró subasta para camiseta:', camisetaId);
        return res.status(404).json({
          success: false,
          message: 'No hay subasta para esta camiseta'
        });
      }

      // Populate manual adicional
      try {
        await em.populate(subasta, ['camiseta.vendedor', 'camiseta.categoria']);
      } catch (populateError) {
        console.warn('⚠️ Error al popular, continuando sin ellos');
      }

      console.log('✅ Subasta encontrada:', subasta.id);

      res.json({
        success: true,
        data: subasta
      });
    } catch (error) {
      console.error('❌ Error en getByCamiseta subasta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subasta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}