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
      
      // ✅ Validar que usuarioId sea un número
      const id = parseInt(usuarioId);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }
      
      const compras = await orm.em.find(Compra, 
        { comprador: { id } },
        { populate: ['camiseta', 'camiseta.categoria', 'metodoPago'] }
      );
      
      // ✅ SIEMPRE DEVOLVER SUCCESS, INCLUSO SI ESTÁ VACÍO
      res.json({
        success: true,
        data: compras,
        count: compras.length,
        message: compras.length > 0 
          ? 'Compras del usuario obtenidas correctamente' 
          : 'No se encontraron compras para este usuario'
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
      const { usuarioId, direccionEnvio, metodoPagoId, items } = req.body;

      // Validaciones básicas
      if (!usuarioId) {
        return res.status(400).json({ success: false, message: 'El usuario es obligatorio' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Debes agregar al menos un producto al carrito' });
      }

      const orm = req.app.locals.orm;

      // Verificar que el usuario existe
      const usuario = await orm.em.findOne(Usuario, { id: usuarioId });
      if (!usuario) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      // Obtener método de pago
      let metodoPago = metodoPagoId ? await orm.em.findOne(MetodoPago, { id: metodoPagoId }) : await orm.em.findOne(MetodoPago, { id: 1 });
      if (!metodoPago) {
        metodoPago = new MetodoPago('Efectivo', 'Pago en efectivo');
        await orm.em.persistAndFlush(metodoPago);
      }

      // Crear la compra (total 0, se calcula luego)
      // const nuevaCompra = new Compra(0, usuario, metodoPago, direccionEnvio);
      const nuevaCompra = orm.em.create(Compra, {
        total: 0,
        comprador: usuario,
        metodoPago,
        direccionEnvio,
        estado: EstadoCompra.PENDIENTE
      });

      let total = 0;
      for (const item of items) {
        // Validar cada item
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

        // Calcular subtotal
        const subtotal = camiseta.precioInicial * item.cantidad;
        total += subtotal;

        // Crear CompraItem
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
      res.status(201).json({ success: true, data: nuevaCompra, message: 'Compra creada correctamente' });
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