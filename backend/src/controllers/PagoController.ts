import { Request, Response } from 'express';
import { Pago, EstadoPago } from '../entities/Pago';  // ✅ AGREGAR: EstadoPago
import { Compra, EstadoCompra } from '../entities/Compra';  // ✅ AGREGAR: EstadoCompra
import { MetodoPago } from '../entities/MetodoPago';
import { EstadoCamiseta } from '../entities/Camiseta';  // ✅ AGREGAR: EstadoCamiseta

export class PagoController {
  // GET /api/pagos
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      const pagos = await orm.em.find(Pago, {}, { 
        populate: ['compra', 'compra.comprador', 'compra.camiseta', 'metodoPago']  // CORREGIDO: 'comprador' no 'usuario'
      });
      
      res.json({
        success: true,
        data: pagos,
        message: 'Pagos obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en getAll pagos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pagos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/pagos/:id
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm;
      
      const pago = await orm.em.findOne(Pago, { id: parseInt(id) }, { 
        populate: ['compra', 'compra.comprador', 'compra.camiseta', 'metodoPago']  // CORREGIDO
      });
      
      if (!pago) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: pago,
        message: 'Pago obtenido correctamente'
      });
    } catch (error) {
      console.error('Error en getById pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/pagos/compra/:compraId
  static async getByCompra(req: Request, res: Response) {
    try {
      const { compraId } = req.params;
      const orm = req.app.locals.orm;
      
      const pagos = await orm.em.find(Pago, 
        { compra: { id: parseInt(compraId) } }, 
        { populate: ['metodoPago'] }
      );
      
      res.json({
        success: true,
        data: pagos,
        count: pagos.length,
        message: 'Pagos de la compra obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en getByCompra pagos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pagos de la compra',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // POST /api/pagos - CORREGIDO
  static async create(req: Request, res: Response) {
    try {
      const { compraId, metodoPagoId, monto, detallesPago } = req.body;
      
      // Validaciones básicas
      if (!compraId) {
        return res.status(400).json({
          success: false,
          message: 'La compra es obligatoria'
        });
      }
      
      if (!metodoPagoId) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago es obligatorio'
        });
      }
      
      if (!monto || monto <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      const orm = req.app.locals.orm;
      
      // Verificar que la compra existe
      const compra = await orm.em.findOne(Compra, { id: compraId });
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
          message: 'La compra ya fue procesada o cancelada'
        });
      }
      
      // Verificar que el método de pago existe
      const metodoPago = await orm.em.findOne(MetodoPago, { id: metodoPagoId });
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }
      
      if (!metodoPago.activo) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago no está disponible'
        });
      }

      // Verificar que el monto coincide con el total de la compra
      if (monto !== compra.total) {
        return res.status(400).json({
          success: false,
          message: `El monto debe ser exactamente $${compra.total}`
        });
      }

      // Simular procesamiento del pago
      let estadoPago = EstadoPago.PENDIENTE;  // ✅ CORREGIDO: Usar enum
      let numeroTransaccion = this.generarNumeroTransaccion();

      // Simular procesamiento básico (90% éxito)
      estadoPago = Math.random() > 0.1 ? EstadoPago.COMPLETADO : EstadoPago.FALLIDO;  // ✅ CORREGIDO

      const nuevoPago = new Pago(
        monto,                    
        compra.id,               
        metodoPago.id,           
        numeroTransaccion        
      );

      // Asignar los objetos completos después de la creación
      nuevoPago.compra = compra;
      nuevoPago.metodoPago = metodoPago;
      nuevoPago.estado = estadoPago;  // ✅ CORREGIDO: Ya es enum, no necesita casting

      await orm.em.persistAndFlush(nuevoPago);

      // Si el pago fue exitoso, actualizar la compra
      if (estadoPago === EstadoPago.COMPLETADO) {  // ✅ CORREGIDO: Usar enum
        compra.estado = EstadoCompra.CONFIRMADA;   // ✅ CORREGIDO: Usar enum
        await orm.em.persistAndFlush(compra);
      }

      res.status(201).json({
        success: true,
        data: nuevoPago,
        message: estadoPago === EstadoPago.COMPLETADO 
          ? 'Pago procesado correctamente' 
          : 'Pago iniciado, pendiente de confirmación',
        estado: estadoPago,
        numeroTransaccion: numeroTransaccion
      });
    } catch (error) {
      console.error('Error en create pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/pagos/:id/confirmar - CORREGIDO
  static async confirmar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { numeroConfirmacion } = req.body;
      
      const orm = req.app.locals.orm;
      
      const pago = await orm.em.findOne(Pago, { id: parseInt(id) }, {
        populate: ['compra', 'compra.camiseta']
      });
      
      if (!pago) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      // ✅ CORREGIDO: Usar enum
      if (pago.estado !== EstadoPago.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'El pago ya fue procesado'
        });
      }

      // ✅ CORREGIDO: Usar enum
      pago.estado = EstadoPago.COMPLETADO;
      
      if (numeroConfirmacion) {
        pago.notas = pago.notas 
          ? `${pago.notas} - Confirmación: ${numeroConfirmacion}`
          : `Confirmación: ${numeroConfirmacion}`;
      }

      // Actualizar estado de la compra
      if (pago.compra) {
        pago.compra.estado = EstadoCompra.CONFIRMADA;  // ✅ CORREGIDO: Usar enum
        
        // Marcar camiseta como vendida
        if (pago.compra.camiseta) {
          pago.compra.camiseta.estado = EstadoCamiseta.VENDIDA;  // ✅ CORREGIDO: Usar enum
        }
      }

      await orm.em.persistAndFlush([pago, pago.compra, pago.compra?.camiseta].filter(Boolean));

      res.json({
        success: true,
        data: pago,
        message: 'Pago confirmado correctamente'
      });
    } catch (error) {
      console.error('Error en confirmar pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al confirmar pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // PUT /api/pagos/:id/rechazar - CORREGIDO
  static async rechazar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      const orm = req.app.locals.orm;
      
      const pago = await orm.em.findOne(Pago, { id: parseInt(id) }, {
        populate: ['compra']
      });
      
      if (!pago) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      // ✅ CORREGIDO: Usar enum
      if (pago.estado !== EstadoPago.PENDIENTE) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar pagos pendientes'
        });
      }

      // ✅ CORREGIDO: Usar enum
      pago.estado = EstadoPago.FALLIDO;
      pago.notas = pago.notas 
        ? `${pago.notas} - Rechazado: ${motivo || 'Sin motivo especificado'}`
        : `Rechazado: ${motivo || 'Sin motivo especificado'}`;

      await orm.em.persistAndFlush(pago);

      res.json({
        success: true,
        data: pago,
        message: 'Pago rechazado'
      });
    } catch (error) {
      console.error('Error en rechazar pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar pago',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Método auxiliar para generar número de transacción
  private static generarNumeroTransaccion(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${timestamp.slice(-6)}${random}`;
  }
}