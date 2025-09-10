import { Request, Response } from 'express';
import { Compra, EstadoCompra } from '../entities/Compra.js';         // ✅ AGREGAR EstadoCompra
import { Usuario } from '../entities/Usuario.js';
import { Camiseta, EstadoCamiseta } from '../entities/Camiseta.js';   // ✅ AGREGAR EstadoCamiseta
import { Descuento } from '../entities/Descuento.js';
import { MetodoPago } from '../entities/MetodoPago.js';

export class CompraController {
  // GET /api/compras
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const compras = await orm.em.find(Compra, {}, { 
        populate: ['comprador', 'camiseta', 'camiseta.categoria', 'metodoPago']  // CORREGIDO
      });
      
      res.json({
        success: true,
        data: compras,
        message: 'Compras obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error en getAll compras:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener compras',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/compras/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const compra = await orm.em.findOne(Compra, { id: parseInt(id) }, { 
        populate: ['comprador', 'camiseta', 'camiseta.categoria', 'metodoPago', 'pagos']  // CORREGIDO: 'comprador' no 'usuario'
      });
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      res.json({
        success: true,
        data: compra,
        message: 'Compra obtenida correctamente'
      });
    } catch (error) {
      console.error('Error en getById compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/compras/usuario/:usuarioId
  static async getByUsuario(req: Request, res: Response) {
    try {
      const { usuarioId } = req.params;
      const orm = req.app.locals.orm;
      
      const compras = await orm.em.find(Compra, 
        { comprador: { id: parseInt(usuarioId) } },  // CORREGIDO: usar 'comprador' no 'usuario'
        { populate: ['camiseta', 'camiseta.categoria'] }  // REMOVIDO: 'descuento' no existe
      );
      
      res.json({
        success: true,
        data: compras,
        count: compras.length,
        message: 'Compras del usuario obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error en getByUsuario compras:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener compras del usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/compras - CORREGIDO
  static async create(req: Request, res: Response) {
    try {
      const { usuarioId, camisetaId, cantidad, codigoDescuento } = req.body;
      
      // Validaciones básicas
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'El usuario es obligatorio'
        });
      }
      
      if (!camisetaId) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta es obligatoria'
        });
      }
      
      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      const orm = req.app.locals.orm;
      
      // Verificar que el usuario existe
      const usuario = await orm.em.findOne(Usuario, { id: usuarioId });
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar que la camiseta existe y está disponible
      const camiseta = await orm.em.findOne(Camiseta, { id: camisetaId });
      if (!camiseta) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }
      
      // ✅ CORREGIDO: Usar enum
      if (camiseta.estado !== EstadoCamiseta.DISPONIBLE) {
        return res.status(400).json({
          success: false,
          message: 'La camiseta no está disponible para compra'
        });
      }

      // Calcular precio base
      let precioUnitario = camiseta.precioInicial;  // CORREGIDO
      let precioTotal = precioUnitario * cantidad;
      let descuentoAplicado = null;
      let montoDescuento = 0;

      // Aplicar descuento si se proporciona código
      if (codigoDescuento) {
        const descuento = await orm.em.findOne(Descuento, { 
          codigo: codigoDescuento,
          activo: true 
        });
        
        if (descuento) {
          // Verificar si el descuento está vigente
          const ahora = new Date();
          if (descuento.fechaInicio <= ahora && descuento.fechaFin >= ahora) {
            montoDescuento = (precioTotal * descuento.porcentaje) / 100;
            descuentoAplicado = descuento;
          }
        }
      }

      const precioFinal = precioTotal - montoDescuento;

      // ✅ CORREGIDO: Obtener objeto MetodoPago completo
      let metodoPago = await orm.em.findOne(MetodoPago, { id: 1 });
      if (!metodoPago) {
        metodoPago = new MetodoPago('Efectivo', 'Pago en efectivo');
        await orm.em.persistAndFlush(metodoPago);
      }

      // ✅ CORREGIDO: Pasar objetos completos al constructor
      const nuevaCompra = new Compra(
        precioFinal,           
        usuario,        // ✅ CORREGIDO: Pasar objeto completo
        camiseta,       // ✅ CORREGIDO: Pasar objeto completo
        metodoPago,     // ✅ CORREGIDO: Pasar objeto completo
        usuario.direccion     
      );
      
      await orm.em.persistAndFlush(nuevaCompra);

      // Respuesta con detalles del descuento aplicado
      const respuesta: any = {
        success: true,
        data: nuevaCompra,
        message: 'Compra creada correctamente',
        detalles: {
          precioOriginal: precioTotal,
          descuentoAplicado: montoDescuento,
          precioFinal: precioFinal
        }
      };

      if (descuentoAplicado) {
        respuesta.descuento = {
          codigo: descuentoAplicado.codigo,
          descripcion: descuentoAplicado.descripcion,
          porcentaje: descuentoAplicado.porcentaje
        };
      }

      res.status(201).json(respuesta);
    } catch (error) {
      console.error('Error en create compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/compras/:id - CORREGIDO
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const orm = req.app.locals.orm;
      const compra = await orm.em.findOne(Compra, { id: parseInt(id) });
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      // ✅ CORREGIDO: Validar usando enum
      if (estado && !Object.values(EstadoCompra).includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Estado no válido. Estados permitidos: ${Object.values(EstadoCompra).join(', ')}`
        });
      }

      if (estado) {
        compra.estado = estado as EstadoCompra;  // ✅ CORREGIDO: Cast al enum
      }

      await orm.em.persistAndFlush(compra);

      res.json({
        success: true,
        data: compra,
        message: 'Compra actualizada correctamente'
      });
    } catch (error) {
      console.error('Error en update compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // DELETE /api/compras/:id - CORREGIDO
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const compra = await orm.em.findOne(Compra, { id: parseInt(id) });
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      // ✅ CORREGIDO: Usar enum
      if (compra.estado !== EstadoCompra.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar compras en estado pendiente'
        });
      }

      await orm.em.removeAndFlush(compra);

      res.json({
        success: true,
        message: 'Compra eliminada correctamente'
      });
    } catch (error) {
      console.error('Error en delete compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/compras/:id/confirmar - CORREGIDO
  static async confirmar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const compra = await orm.em.findOne(Compra, { id: parseInt(id) }, {
        populate: ['camiseta']
      });
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      // ✅ CORREGIDO: Usar enum
      if (compra.estado !== EstadoCompra.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'La compra ya fue procesada'
        });
      }

      // ✅ CORREGIDO: Usar enums
      compra.estado = EstadoCompra.CONFIRMADA;
      
      if (compra.camiseta) {
        compra.camiseta.estado = EstadoCamiseta.VENDIDA;
      }

      await orm.em.persistAndFlush([compra, compra.camiseta]);

      res.json({
        success: true,
        data: compra,
        message: 'Compra confirmada correctamente'
      });
    } catch (error) {
      console.error('Error en confirmar compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al confirmar compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}