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

      const { 
        activas, 
        camisetaId,
        vendedorId,
        page = '1', 
        limit = '50' 
      } = req.query;

      console.log('📊 Query params:', { activas, camisetaId, vendedorId });

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};

      // Filtro por activas/finalizadas
      if (activas === 'true') {
        where.fechaFin = { $gte: new Date() };
        console.log('🔥 Filtrando ACTIVAS');
      } else if (activas === 'false') {
        where.fechaFin = { $lt: new Date() };
        console.log('📦 Filtrando FINALIZADAS');
      }

      // ✅ Filtro por camisetaId
      if (camisetaId) {
        const id = parseInt(camisetaId as string, 10);
        if (!isNaN(id)) {
          where.camiseta = id;
          console.log('👕 Filtrando por camiseta:', id);
        }
      }

      console.log('🔍 WHERE:', JSON.stringify(where));

      let subastas: Subasta[];
      let count: number;

      // ✅ QUERY DIFERENTE para vendedorId
      if (vendedorId) {
        const vendedorIdNum = parseInt(vendedorId as string, 10);
        console.log('👤 Buscando subastas del vendedor:', vendedorIdNum);

        // ✅ Buscar con query builder para evitar errores de populate
        const qb = em.createQueryBuilder(Subasta, 's');
        qb.select('s.*')
          .leftJoin('s.camiseta', 'c')
          .where(where)
          .andWhere({ 'c.vendedor': vendedorIdNum })
          .orderBy({ 's.fechaInicio': 'DESC' })
          .limit(limitNum)
          .offset(offset);

        subastas = await qb.getResultList();
        count = await qb.getCount();

        // ✅ Populate manual después de la query
        await em.populate(subastas, ['camiseta', 'camiseta.vendedor', 'camiseta.categoria']);

      } else {
        // ✅ QUERY NORMAL sin vendedorId
        try {
          [subastas, count] = await em.findAndCount(
            Subasta, 
            where, 
            {
              populate: ['camiseta', 'camiseta.vendedor', 'camiseta.categoria'],
              limit: limitNum,
              offset,
              orderBy: { fechaInicio: 'DESC' }
            }
          );
        } catch (populateError) {
          console.error('❌ Error en populate, intentando sin categoria:', populateError);
          
          // ✅ Fallback: sin categoria
          [subastas, count] = await em.findAndCount(
            Subasta, 
            where, 
            {
              populate: ['camiseta', 'camiseta.vendedor'],
              limit: limitNum,
              offset,
              orderBy: { fechaInicio: 'DESC' }
            }
          );
        }
      }

      console.log(`✅ Encontradas ${count} subastas`);

      res.json({
        success: true,
        data: subastas,
        count,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum)
      });

    } catch (error) {
      console.error('❌ ERROR COMPLETO en getAll subastas:', error);
      
      if (error instanceof Error) {
        console.error('❌ Stack:', error.stack);
      }

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
}