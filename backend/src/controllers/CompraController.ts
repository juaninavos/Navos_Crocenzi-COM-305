import { Request, Response } from 'express';
import { Compra, EstadoCompra } from '../entities/Compra';         // ✅ AGREGAR EstadoCompra
import { Usuario } from '../entities/Usuario';
import { Camiseta, EstadoCamiseta } from '../entities/Camiseta';   // ✅ AGREGAR EstadoCamiseta
import { Descuento } from '../entities/Descuento';
import { MetodoPago } from '../entities/MetodoPago';

export class CompraController {
  // GET /api/compras
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const compras = await orm.em.find(Compra, {}, { 
        populate: ['comprador', 'camiseta', 'camiseta.categoria', 'metodoPago']
      });
      res.json({
        success: true,
        message: 'Operación getAll realizada correctamente.',
        data: compras
      });
    } catch (error) {
      console.error('Error en getAll compras:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener compras: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETALL_ERROR'
      });
    }
  }

  // GET /api/compras/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      const compra = await orm.em.findOne(Compra, { id: parseInt(id) }, { 
        populate: ['comprador', 'camiseta', 'camiseta.categoria', 'metodoPago', 'pagos']
      });
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo obtener compra: compra no encontrada.',
          error: 'Compra no encontrada',
          code: 'NOT_FOUND'
        });
      }
      res.json({
        success: true,
        message: 'Operación getById realizada correctamente.',
        data: compra
      });
    } catch (error) {
      console.error('Error en getById compra:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener compra: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETBYID_ERROR'
      });
    }
  }

  // GET /api/compras/usuario/:usuarioId
  static async getByUsuario(req: Request, res: Response) {
    try {
      const { usuarioId } = req.params;
      const orm = req.app.locals.orm;
      const id = parseInt(usuarioId);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo obtener compras: ID de usuario inválido.',
          error: 'ID de usuario inválido',
          code: 'INVALID_USER_ID'
        });
      }
      const compras = await orm.em.find(Compra, 
        { comprador: { id } },
        { populate: ['camiseta', 'camiseta.categoria', 'metodoPago'] }
      );
      res.json({
        success: true,
        message: compras.length > 0 
          ? 'Operación getByUsuario realizada correctamente.'
          : 'No se encontraron compras para este usuario.',
        data: compras,
        count: compras.length
      });
    } catch (error) {
      console.error('Error en getByUsuario compras:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener compras: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETBYUSUARIO_ERROR'
      });
    }
  }

  // POST /api/compras - CORREGIDO
  static async create(req: Request, res: Response) {
    try {
      const { usuarioId, direccionEnvio, metodoPagoId, items } = req.body;
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo crear la compra: el usuario es obligatorio.',
          error: 'Usuario es obligatorio',
          code: 'USER_REQUIRED'
        });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo crear la compra: debes agregar al menos un producto al carrito.',
          error: 'Carrito vacío',
          code: 'CART_EMPTY'
        });
      }
      const orm = req.app.locals.orm;
      const usuario = await orm.em.findOne(Usuario, { id: usuarioId });
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo crear la compra: usuario no encontrado.',
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }
      let metodoPago = metodoPagoId ? await orm.em.findOne(MetodoPago, { id: metodoPagoId }) : await orm.em.findOne(MetodoPago, { id: 1 });
      if (!metodoPago) {
        metodoPago = new MetodoPago('Efectivo', 'Pago en efectivo');
        await orm.em.persistAndFlush(metodoPago);
      }
      const nuevaCompra = orm.em.create(Compra, {
        total: 0,
        comprador: usuario,
        metodoPago,
        direccionEnvio,
        estado: EstadoCompra.PENDIENTE
      });
      let total = 0;
      for (const item of items) {
        if (!item.camisetaId || !item.cantidad || item.cantidad <= 0) {
          continue;
        }
        const camiseta = await orm.em.findOne(Camiseta, { id: item.camisetaId });
        if (!camiseta) {
          continue;
        }
        if (camiseta.estado !== EstadoCamiseta.DISPONIBLE) {
          continue;
        }
        const subtotal = camiseta.precioInicial * item.cantidad;
        total += subtotal;
        const compraItem = orm.em.create('CompraItem', {
          compra: nuevaCompra,
          camiseta,
          cantidad: item.cantidad
        });
        nuevaCompra.items.add(compraItem);
        await orm.em.persistAndFlush(compraItem);
      }
      nuevaCompra.total = total;
      await orm.em.persistAndFlush(nuevaCompra);
      res.status(201).json({
        success: true,
        message: 'Operación create realizada correctamente.',
        data: nuevaCompra
      });
    } catch (error) {
      console.error('Error en create compra:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo crear la compra: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'CREATE_ERROR'
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
          message: 'No se pudo actualizar compra: compra no encontrada.',
          error: 'Compra no encontrada',
          code: 'NOT_FOUND'
        });
      }
      if (estado && !Object.values(EstadoCompra).includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `No se pudo actualizar compra: estado no válido. Estados permitidos: ${Object.values(EstadoCompra).join(', ')}`,
          error: 'Estado no válido',
          code: 'INVALID_STATE'
        });
      }
      if (estado) {
        compra.estado = estado as EstadoCompra;
      }
      await orm.em.persistAndFlush(compra);
      res.json({
        success: true,
        message: 'Operación update realizada correctamente.',
        data: compra
      });
    } catch (error) {
      console.error('Error en update compra:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo actualizar compra: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'UPDATE_ERROR'
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
          message: 'No se pudo eliminar compra: compra no encontrada.',
          error: 'Compra no encontrada',
          code: 'NOT_FOUND'
        });
      }
      if (compra.estado !== EstadoCompra.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo eliminar compra: solo se pueden eliminar compras en estado pendiente.',
          error: 'Estado no permitido',
          code: 'INVALID_STATE'
        });
      }
      await orm.em.removeAndFlush(compra);
      res.json({
        success: true,
        message: 'Operación delete realizada correctamente.'
      });
    } catch (error) {
      console.error('Error en delete compra:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo eliminar compra: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'DELETE_ERROR'
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
          message: 'No se pudo confirmar compra: compra no encontrada.',
          error: 'Compra no encontrada',
          code: 'NOT_FOUND'
        });
      }
      if (compra.estado !== EstadoCompra.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo confirmar compra: la compra ya fue procesada.',
          error: 'Estado no permitido',
          code: 'INVALID_STATE'
        });
      }
      compra.estado = EstadoCompra.CONFIRMADA;
      if (compra.camiseta) {
        compra.camiseta.estado = EstadoCamiseta.VENDIDA;
      }
      await orm.em.persistAndFlush([compra, compra.camiseta]);
      res.json({
        success: true,
        message: 'Operación confirmar realizada correctamente.',
        data: compra
      });
    } catch (error) {
      console.error('Error en confirmar compra:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo confirmar compra: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'CONFIRMAR_ERROR'
      });
    }
  }
}