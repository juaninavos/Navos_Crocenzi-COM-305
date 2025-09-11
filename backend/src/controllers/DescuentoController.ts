import { Request, Response } from 'express';
import { Descuento } from '../entities/Descuento.js';
import { UsuarioRol } from '../entities/Usuario.js';

export class DescuentoController {
  // GET /api/descuentos
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const { activos, vigentes } = req.query;
      
      let filtros: any = {};
      
      // Filtro para descuentos activos
      if (activos === 'true') {
        filtros.activo = true;
      }
      
      // Filtro para descuentos vigentes (dentro del rango de fechas)
      if (vigentes === 'true') {
        const ahora = new Date();
        filtros.fechaInicio = { $lte: ahora };
        filtros.fechaFin = { $gte: ahora };
        filtros.activo = true;
      }
      
      const descuentos = await orm.em.find(Descuento, filtros);
      
      res.json({
        success: true,
        data: descuentos,
        count: descuentos.length,
        message: 'Descuentos obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en getAll descuentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener descuentos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/descuentos/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const descuento = await orm.em.findOne(Descuento, { id: parseInt(id) });
      
      if (!descuento) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      res.json({
        success: true,
        data: descuento,
        message: 'Descuento obtenido correctamente'
      });
    } catch (error) {
      console.error('Error en getById descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener descuento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/descuentos/validar/:codigo
  static async validarCodigo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const { montoCompra } = req.query;
      
      const orm = req.app.locals.orm;
      
      const descuento = await orm.em.findOne(Descuento, { 
        codigo: codigo.toUpperCase(),
        activo: true 
      });
      
      if (!descuento) {
        return res.status(404).json({
          success: false,
          message: 'Código de descuento no válido',
          valido: false
        });
      }

      // Verificar si está vigente
      const ahora = new Date();
      const vigente = descuento.fechaInicio <= ahora && descuento.fechaFin >= ahora;
      
      if (!vigente) {
        return res.status(400).json({
          success: false,
          message: 'El código de descuento ha expirado',
          valido: false,
          fechaVencimiento: descuento.fechaFin
        });
      }

      // Calcular descuento usando el porcentaje
      let montoDescuento = 0;
      if (montoCompra) {
        const monto = parseFloat(montoCompra as string);
        montoDescuento = (monto * descuento.porcentaje) / 100;
      }

      res.json({
        success: true,
        message: 'Código de descuento válido',
        valido: true,
        descuento: {
          id: descuento.id,
          codigo: descuento.codigo,
          descripcion: descuento.descripcion,
          porcentaje: descuento.porcentaje,
          fechaVencimiento: descuento.fechaFin
        },
        montoDescuento: montoDescuento || null
      });
    } catch (error) {
      console.error('Error en validar código descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar código de descuento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/descuentos
  static async create(req: Request, res: Response) {
    try {
      // ✅ AGREGAR: Solo administradores pueden crear descuentos
      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden crear descuentos'
        });
      }

      const { codigo, descripcion, porcentaje, fechaInicio, fechaFin } = req.body;
      
      // Validaciones básicas
      if (!codigo) {
        return res.status(400).json({
          success: false,
          message: 'El código es obligatorio'
        });
      }
      
      if (!descripcion) {
        return res.status(400).json({
          success: false,
          message: 'La descripción es obligatoria'
        });
      }
      
      if (!porcentaje || porcentaje <= 0 || porcentaje > 100) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje debe estar entre 1 y 100'
        });
      }
      
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son obligatorias'
        });
      }

      const orm = req.app.locals.orm;
      
      // Verificar que el código no exista
      const codigoExistente = await orm.em.findOne(Descuento, { 
        codigo: codigo.toUpperCase() 
      });
      
      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          message: 'El código de descuento ya existe'
        });
      }

      // Validar fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      // ✅ OPCIONAL: Validar que las fechas sean válidas
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas proporcionadas no son válidas'
        });
      }
      
      if (fin <= inicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // ✅ OPCIONAL: Validar que la fecha de inicio no sea muy antigua
      const ahora = new Date();
      const unAnioAtras = new Date();
      unAnioAtras.setFullYear(ahora.getFullYear() - 1);
      
      if (inicio < unAnioAtras) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser más de un año en el pasado'
        });
      }

      // ✅ USAR CONSTRUCTOR
      const nuevoDescuento = new Descuento(
        codigo.toUpperCase(),
        descripcion,
        porcentaje,
        inicio,
        fin,
        true
      );

      await orm.em.persistAndFlush(nuevoDescuento);

      res.status(201).json({
        success: true,
        data: nuevoDescuento,
        message: 'Descuento creado correctamente'
      });
    } catch (error) {
      console.error('Error en create descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear descuento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/descuentos/:id
  static async update(req: Request, res: Response) {
    try {
      // ✅ AGREGAR: Solo administradores pueden actualizar descuentos
      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden modificar descuentos'
        });
      }

      const { id } = req.params;
      const { descripcion, porcentaje, fechaInicio, fechaFin, activo } = req.body;
      
      const orm = req.app.locals.orm;
      const descuento = await orm.em.findOne(Descuento, { id: parseInt(id) });
      
      if (!descuento) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      // Actualizar campos si se proporcionan
      if (descripcion !== undefined) descuento.descripcion = descripcion;
      
      // ✅ MEJORADO: Validación más específica para porcentaje
      if (porcentaje !== undefined) {
        if (porcentaje <= 0 || porcentaje > 100) {
          return res.status(400).json({
            success: false,
            message: 'El porcentaje debe estar entre 1 y 100'
          });
        }
        descuento.porcentaje = porcentaje;
      }
      
      if (fechaInicio !== undefined) descuento.fechaInicio = new Date(fechaInicio);
      if (fechaFin !== undefined) descuento.fechaFin = new Date(fechaFin);
      if (activo !== undefined) descuento.activo = activo;

      // Validar fechas si se actualizaron
      if (descuento.fechaFin <= descuento.fechaInicio) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      await orm.em.persistAndFlush(descuento);

      res.json({
        success: true,
        data: descuento,
        message: 'Descuento actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en update descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar descuento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // DELETE /api/descuentos/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const descuento = await orm.em.findOne(Descuento, { id: parseInt(id) });
      
      if (!descuento) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      // En lugar de eliminar, desactivar el descuento para mantener historial
      descuento.activo = false;
      await orm.em.persistAndFlush(descuento);

      res.json({
        success: true,
        message: 'Descuento desactivado correctamente'
      });
    } catch (error) {
      console.error('Error en delete descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar descuento',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}