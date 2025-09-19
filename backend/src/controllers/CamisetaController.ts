import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Camiseta, Talle, CondicionCamiseta, EstadoCamiseta } from '../entities/Camiseta.js';
import { Usuario, UsuarioRol } from '../entities/Usuario.js';  // ✅ CORREGIDO: Import desde Usuario.js
import { Categoria } from '../entities/Categoria.js';
import '../types/auth.js'; // ✅ AGREGAR: Para tipado de req.user


export class CamisetaController {
  
  // GET /api/camisetas - Con filtros
  static async getAll(req: Request, res: Response) {
    try {
      // Zod: Validación estricta de filtros
  const { equipo, temporada, talle, condicion, esSubasta } = req.query;
      const { z } = await import('zod');
      const TalleEnum = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);
      const CondicionEnum = z.enum(["NUEVA", "USADA", "VINTAGE"]);
      const filtrosSchema = z.object({
        equipo: z.string().optional(),
        temporada: z.string().optional(),
        talle: TalleEnum.optional(),
        condicion: CondicionEnum.optional(),
        esSubasta: z.preprocess((val) => {
          if (typeof val === 'string') {
            if (val === 'true') return true;
            if (val === 'false') return false;
          }
          return val;
        }, z.boolean().optional())
      });
      const parseResult = filtrosSchema.safeParse({ equipo, temporada, talle, condicion, esSubasta });
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Filtros inválidos',
          errors: parseResult.error.issues
        });
      }
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      const filtros: any = { estado: { $ne: EstadoCamiseta.INACTIVA } };
      if (parseResult.data.equipo) {
        const equipoValue = decodeURIComponent(parseResult.data.equipo);
        filtros.equipo = equipoValue;
      }
      if (parseResult.data.temporada) {
        filtros.temporada = parseResult.data.temporada;
      }
      if (parseResult.data.talle) {
        filtros.talle = parseResult.data.talle;
      }
      if (parseResult.data.condicion) {
        filtros.condicion = parseResult.data.condicion;
      }
      if (typeof parseResult.data.esSubasta === 'boolean') {
        filtros.esSubasta = parseResult.data.esSubasta;
      }
      const camisetas = await em.find(Camiseta, filtros, {
        populate: ['categoria', 'vendedor']
      });
      res.json({
        success: true,
        data: camisetas,
        count: camisetas.length,
        debug: {
          filtrosRecibidos: { equipo, temporada, talle, condicion },
          filtrosAplicados: filtros
        },
        message: 'Camisetas obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error en getAll camisetas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener camisetas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/camisetas/:id
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const camiseta = await em.findOne(Camiseta, { id: parseInt(id) }, {
        populate: ['categoria', 'vendedor']
      });
      
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }

      res.json({
        success: true,
        data: camiseta
      });
    } catch (error) {
      console.error('Error en getOne camiseta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener camiseta'
      });
    }
  }

  // POST /api/camisetas
  static async create(req: Request, res: Response) {
    try {
      // Solo usuarios pueden vender camisetas
      if (req.user.rol !== UsuarioRol.USUARIO) {
        return res.status(403).json({
          success: false,
          message: 'Solo usuarios pueden publicar camisetas para venta'
        });
      }

      // El vendedor es el usuario autenticado
      const vendedorId = req.user.id;

      // Validación robusta con Zod
      const { z } = await import('zod');
      const TalleEnum = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);
      const CondicionEnum = z.enum(["NUEVA", "USADA", "REACONDICIONADA"]);
      const createSchema = z.object({
        titulo: z.string().min(2),
        descripcion: z.string().min(5),
        equipo: z.string().min(2),
        temporada: z.string().min(2),
        talle: TalleEnum,
        condicion: CondicionEnum,
        imagen: z.string().min(5),
        precioInicial: z.number().positive(),
        categoriaId: z.number().int().optional()
      });
      // Si viene como string (por JSON), convertir precioInicial y categoriaId
      const body = {
        ...req.body,
        precioInicial: typeof req.body.precioInicial === 'string' ? Number(req.body.precioInicial) : req.body.precioInicial,
        categoriaId: req.body.categoriaId !== undefined ? Number(req.body.categoriaId) : undefined
      };
      const parseResult = createSchema.safeParse(body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos para crear camiseta',
          errors: parseResult.error.issues
        });
      }
      const {
        titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, categoriaId
      } = parseResult.data;

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      // Usar clase Usuario en lugar de string
      const vendedor = await em.findOne(Usuario, { id: vendedorId });
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado'
        });
      }

      const nuevaCamiseta = new Camiseta(
        titulo,
        descripcion,
        equipo,
        temporada,
        talle as Talle,
        condicion as CondicionCamiseta,
        imagen,
        precioInicial,
        vendedor
      );

      // Usar clase Categoria y verificar existencia
      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId });
        if (categoria) {
          nuevaCamiseta.categoria = categoria;
        }
      }

      em.persist(nuevaCamiseta);
      await em.flush();

      res.status(201).json({
        success: true,
        data: nuevaCamiseta,
        message: 'Camiseta creada correctamente'
      });
    } catch (error) {
      console.error('Error en create camiseta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear camiseta'
      });
    }
  }

  // PUT /api/camisetas/:id
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { titulo, descripcion, precioInicial, stock, estado } = req.body;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const camiseta = await em.findOne(Camiseta, { id: parseInt(id) });
      
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }

      if (titulo) camiseta.titulo = titulo;
      if (descripcion) camiseta.descripcion = descripcion;
      if (precioInicial) camiseta.precioInicial = precioInicial;
      if (stock !== undefined) camiseta.stock = stock;
      if (estado) camiseta.estado = estado as EstadoCamiseta;

      await em.flush();

      res.json({
        success: true,
        data: camiseta,
        message: 'Camiseta actualizada correctamente'
      });
    } catch (error) {
      console.error('Error en update camiseta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar camiseta'
      });
    }
  }

  // DELETE /api/camisetas/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const camiseta = await em.findOne(Camiseta, { id: parseInt(id) });
      
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'Camiseta no encontrada'
        });
      }

      camiseta.estado = EstadoCamiseta.INACTIVA;
      await em.flush();

      res.json({
        success: true,
        message: 'Camiseta eliminada correctamente'
      });
    } catch (error) {
      console.error('Error en delete camiseta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar camiseta'
      });
    }
  }

  // CASO DE USO: Publicar camiseta para venta
  // POST /api/camisetas/publicar
  static async publicarParaVenta(req: Request, res: Response) {
    try {
      const { 
        titulo, descripcion, equipo, temporada, talle, condicion, 
        imagen, precioInicial, esSubasta, stock, categoriaId, vendedorId,
        fechaFinSubasta // Solo si es subasta
      } = req.body;
      
      // Validaciones específicas del caso de uso
      if (!titulo || !equipo || !temporada || !talle || !condicion || !precioInicial || !vendedorId) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios para publicar la camiseta',
          camposRequeridos: ['titulo', 'equipo', 'temporada', 'talle', 'condicion', 'precioInicial', 'vendedorId']
        });
      }

      // Validar que los enums sean correctos
      const tallesValidos = Object.values(Talle);
      const condicionesValidas = Object.values(CondicionCamiseta);

      if (!tallesValidos.includes(talle)) {
        return res.status(400).json({
          success: false,
          message: `Talle inválido. Valores permitidos: ${tallesValidos.join(', ')}`
        });
      }

      if (!condicionesValidas.includes(condicion)) {
        return res.status(400).json({
          success: false,
          message: `Condición inválida. Valores permitidos: ${condicionesValidas.join(', ')}`
        });
      }

      // Validaciones específicas de negocio
      if (precioInicial <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio inicial debe ser mayor a 0'
        });
      }

      if (stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'El stock debe ser al menos 1'
        });
      }

      // Si es subasta, validar fecha fin
      if (esSubasta && fechaFinSubasta) {
        const fechaFin = new Date(fechaFinSubasta);
        const ahora = new Date();
        
        if (fechaFin <= ahora) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin de subasta debe ser futura'
          });
        }
      }
      
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      // ✅ CORREGIDO: Usar clase Usuario en lugar de string
      const vendedor = await em.findOne(Usuario, { id: vendedorId, activo: true });
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: 'Vendedor no encontrado o inactivo'
        });
      }

      // Verificar que la categoría existe (si se proporciona)
      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId, activa: true });
        if (!categoria) {
          return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada o inactiva'
          });
        }
      }
      
      const nuevaCamiseta = new Camiseta(
        titulo,
        descripcion || `Camiseta ${equipo} temporada ${temporada}`,
        equipo,
        temporada,
        talle as Talle,
        condicion as CondicionCamiseta,
        imagen || '',
        precioInicial,
        vendedor  // ✅ Ahora TypeScript reconoce el tipo correcto
      );
      
      nuevaCamiseta.esSubasta = esSubasta || false;
      nuevaCamiseta.stock = stock || 1;
      
      // Establecer estado según tipo de venta
      if (esSubasta) {
        nuevaCamiseta.estado = EstadoCamiseta.EN_SUBASTA;
      } else {
        nuevaCamiseta.estado = EstadoCamiseta.DISPONIBLE;
      }
      
      // ✅ CORREGIDO: Asignar categoría si existe
      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId });
        if (categoria) {
          nuevaCamiseta.categoria = categoria;
        }
      }

      em.persist(nuevaCamiseta);
      await em.flush();

      // Obtener la camiseta completa para respuesta
      const camisetaCompleta = await em.findOne(Camiseta, { id: nuevaCamiseta.id }, {
        populate: ['categoria', 'vendedor']
      });

      res.status(201).json({
        success: true,
        data: camisetaCompleta,
        message: `Camiseta ${esSubasta ? 'publicada en subasta' : 'publicada para venta directa'} correctamente`,
        caso_uso: 'publicar_camiseta_para_venta',
        detalles: {
          tipo_venta: esSubasta ? 'subasta' : 'precio_fijo',
          precio_inicial: precioInicial,
          stock: nuevaCamiseta.stock,
          estado: nuevaCamiseta.estado
        }
      });
    } catch (error) {
      console.error('Error en publicarParaVenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al publicar camiseta para venta',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}