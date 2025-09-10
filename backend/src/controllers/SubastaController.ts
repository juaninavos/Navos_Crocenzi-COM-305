import { Request, Response } from 'express';
import { Subasta } from '../entities/Subasta.js';
import { Camiseta, EstadoCamiseta } from '../entities/Camiseta.js';  // ✅ AGREGAR EstadoCamiseta

export class SubastaController {
  // GET /api/subastas - PERFECTO
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const { activas } = req.query;
      
      let filtros: any = {};
      
      // Filtro para subastas activas
      if (activas === 'true') {
        filtros.fechaFin = { $gte: new Date() };
        filtros.activa = true;  // ✅ AGREGAR: También verificar campo activa
      }
      
      const subastas = await orm.em.find(Subasta, filtros, { 
        populate: ['camiseta', 'camiseta.categoria', 'camiseta.vendedor']
      });
      
      res.json({
        success: true,
        data: subastas,
        count: subastas.length,
        message: 'Subastas obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error en getAll subastas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subastas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/subastas/:id - MEJORAR populate
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const subasta = await orm.em.findOne(Subasta, { id: parseInt(id) }, { 
        populate: ['camiseta', 'camiseta.categoria', 'camiseta.vendedor', 'ganador']  // ✅ MEJORADO
      });
      
      if (!subasta) {
        return res.status(404).json({
          success: false,
          message: 'Subasta no encontrada'
        });
      }

      res.json({
        success: true,
        data: subasta,
        message: 'Subasta obtenida correctamente'
      });
    } catch (error) {
      console.error('Error en getById subasta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subasta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/subastas - CORREGIR constructor
  static async create(req: Request, res: Response) {
    try {
      const { fechaInicio, fechaFin, camisetaId, precioInicial } = req.body;
      
      // ✅ MEJORAR validaciones
      if (!fechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio es obligatoria'
        });
      }
      
      if (!fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin es obligatoria'
        });
      }
      
      if (!camisetaId) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta es obligatoria'
        });
      }

      // ✅ AGREGAR: Validaciones de fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const ahora = new Date();

      if (fin <= inicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      if (inicio < ahora) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser en el pasado'
        });
      }

      const orm = req.app.locals.orm;
      
      // Verificar que la camiseta existe y está disponible
      const camiseta = await orm.em.findOne(Camiseta, { id: camisetaId });
      if (!camiseta) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }

      // ✅ AGREGAR: Verificar que la camiseta esté disponible
      if (camiseta.estado !== EstadoCamiseta.DISPONIBLE) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta no está disponible para subasta'
        });
      }

      // ✅ AGREGAR: Verificar que no haya otra subasta activa para esta camiseta
      const subastaExistente = await orm.em.findOne(Subasta, {
        camiseta: camiseta,
        activa: true,
        fechaFin: { $gte: ahora }
      });

      if (subastaExistente) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta ya tiene una subasta activa'
        });
      }

      // ✅ CORREGIDO: Usar constructor con parámetros
      const nuevaSubasta = new Subasta(
        inicio,                                    // fechaInicio
        fin,                                       // fechaFin  
        precioInicial || camiseta.precioInicial,   // precioActual
        camiseta                                   // camiseta
      );

      // ✅ YA NO ES NECESARIO: Los valores ya están asignados por el constructor
      // nuevaSubasta.fechaInicio = inicio;
      // nuevaSubasta.fechaFin = fin;
      // nuevaSubasta.precioActual = precioInicial || camiseta.precioInicial;
      // nuevaSubasta.camiseta = camiseta;
      // nuevaSubasta.activa = true;  // ← Se inicializa por defecto

      // ✅ AGREGAR: Cambiar estado de la camiseta
      camiseta.estado = EstadoCamiseta.EN_SUBASTA;

      await orm.em.persistAndFlush([nuevaSubasta, camiseta]);

      // Cargar subasta completa para respuesta
      const subastaCompleta = await orm.em.findOne(Subasta, { id: nuevaSubasta.id }, {
        populate: ['camiseta', 'camiseta.categoria', 'camiseta.vendedor']
      });

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

  // ✅ AGREGAR: Método para finalizar subasta
  static async finalizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const subasta = await orm.em.findOne(Subasta, { id: parseInt(id) }, {
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

      await orm.em.persistAndFlush([subasta, subasta.camiseta]);

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