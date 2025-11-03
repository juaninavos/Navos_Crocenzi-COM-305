import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Camiseta, Talle, CondicionCamiseta, EstadoCamiseta } from '../entities/Camiseta';
import { Usuario, UsuarioRol } from '../entities/Usuario';
import { Categoria } from '../entities/Categoria';
import '../types/auth'; // req.user tipado

import { z } from 'zod';

export class CamisetaController {

  // ✅ Schemas centralizados
  private static TalleEnum = z.nativeEnum(Talle);
  private static CondicionEnum = z.nativeEnum(CondicionCamiseta);
  private static EstadoEnum = z.nativeEnum(EstadoCamiseta);

  // GET /api/camisetas
  static async getAll(req: Request, res: Response) {
    try {
      const filtrosSchema = z.object({
        equipo: z.string().optional(),
        temporada: z.string().optional(),
        talle: CamisetaController.TalleEnum.optional(),
        condicion: CamisetaController.CondicionEnum.optional(),
        vendedorId: z.preprocess((v) => {
          const n = Number(v);
          return Number.isNaN(n) ? undefined : Math.trunc(n);
        }, z.number().int().positive().optional()),
        esSubasta: z.preprocess((val) => {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return val;
        }, z.boolean().optional())
        ,
        precioMin: z.preprocess((val) => {
          if (val === '' || val == null) return undefined;
          const n = Number(val);
          return Number.isNaN(n) ? undefined : n;
        }, z.number().min(0).optional()),
        precioMax: z.preprocess((val) => {
          if (val === '' || val == null) return undefined;
          const n = Number(val);
          return Number.isNaN(n) ? undefined : n;
        }, z.number().min(0).optional())
        ,
        page: z.preprocess((v) => {
          const n = Number(v);
          return Number.isNaN(n) ? undefined : Math.max(1, Math.trunc(n));
        }, z.number().min(1).optional()),
        limit: z.preprocess((v) => {
          const n = Number(v);
          return Number.isNaN(n) ? undefined : Math.max(1, Math.trunc(n));
        }, z.number().min(1).optional()),
        sort: z.string().optional()
      });

      const parseResult = filtrosSchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo obtener camisetas: filtros inválidos.',
          error: 'Filtros inválidos',
          code: 'INVALID_FILTERS',
          details: parseResult.error.issues
        });
      }

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const parsed = parseResult.data;

      // Construir where dinámico para incluir rango de precio si está presente
      const where: any = { estado: { $ne: EstadoCamiseta.INACTIVA } };
      if (parsed.equipo) where.equipo = parsed.equipo;
      if (parsed.temporada) where.temporada = parsed.temporada;
      if (parsed.talle) where.talle = parsed.talle;
      if (parsed.condicion) where.condicion = parsed.condicion;
      if (typeof parsed.esSubasta === 'boolean') where.esSubasta = parsed.esSubasta;
  if (typeof parsed.vendedorId === 'number') where.vendedor = { id: parsed.vendedorId };

      // Rango de precio
      const priceCond: any = {};
      if (typeof parsed.precioMin === 'number') priceCond.$gte = parsed.precioMin;
      if (typeof parsed.precioMax === 'number') priceCond.$lte = parsed.precioMax;
      if (Object.keys(priceCond).length > 0) where.precioInicial = priceCond;

      // DEBUG: log parsed filtros and where to help tracing issues with price filters
      console.log('Parsed filtros:', parsed);
      try {
        console.log('Constructed where for query:', JSON.stringify(where));
      } catch (err) {
        console.log('Constructed where (non-serializable):', where);
      }

      // Paginación y ordenamiento
      const page = parsed.page ?? 1;
      const limit = parsed.limit ?? 9;
      const offset = (page - 1) * limit;

      let orderBy: any = { fechaPublicacion: 'DESC' };
      switch (parsed.sort) {
        case 'precioAsc':
          orderBy = { precioInicial: 'ASC' };
          break;
        case 'precioDesc':
          orderBy = { precioInicial: 'DESC' };
          break;
        case 'fechaAsc':
          orderBy = { fechaPublicacion: 'ASC' };
          break;
        case 'fechaDesc':
        default:
          orderBy = { fechaPublicacion: 'DESC' };
      }

      const [camisetasList, total] = await Promise.all([
        em.find(Camiseta, where, { populate: ['categoria', 'vendedor'], limit, offset, orderBy }),
        em.count(Camiseta, where)
      ]);

      res.json({
        success: true,
        message: 'Operación getAll realizada correctamente.',
        data: camisetasList,
        count: total,
        page,
        limit
      });
    } catch (error) {
      console.error('Error en getAll camisetas:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener camisetas: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETALL_ERROR'
      });
    }
  }

  // GET /api/camisetas/:id
  static async getOne(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      const camiseta = await em.findOne(Camiseta, { id: Number(req.params.id) }, { populate: ['categoria', 'vendedor'] });

      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo obtener camiseta: camiseta no encontrada.',
          error: 'Camiseta no encontrada',
          code: 'NOT_FOUND'
        });
      }
      res.json({
        success: true,
        message: 'Operación getOne realizada correctamente.',
        data: camiseta
      });
    } catch (error) {
      console.error('Error en getOne camiseta:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener camiseta: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETONE_ERROR'
      });
    }
  }

  // POST /api/camisetas
  static async create(req: Request, res: Response) {
    try {
      // ✅ VALIDACIÓN AGREGADA
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No se pudo crear camiseta: no autorizado.',
          error: 'No autorizado',
          code: 'UNAUTHORIZED'
        });
      }
      if (req.user.rol !== UsuarioRol.USUARIO) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo crear camiseta: solo usuarios pueden publicar camisetas.',
          error: 'Rol no permitido',
          code: 'FORBIDDEN'
        });
      }

      const createSchema = z.object({
        titulo: z.string().min(2),
        descripcion: z.string().min(5),
        equipo: z.string().min(2),
        temporada: z.string().min(2),
        talle: CamisetaController.TalleEnum,
        condicion: CamisetaController.CondicionEnum,
        imagen: z.string().min(5),
        precioInicial: z.coerce.number().positive(),
        categoriaId: z.coerce.number().int().optional()
      });

      const parseResult = createSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo crear camiseta: datos inválidos.',
          error: 'Datos inválidos',
          code: 'INVALID_DATA',
          details: parseResult.error.issues
        });
      }

      const { titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, categoriaId } = parseResult.data;

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const vendedor = await em.findOne(Usuario, { id: req.user.id });
      if (!vendedor) return res.status(404).json({
        success: false,
        message: 'No se pudo crear camiseta: vendedor no encontrado.',
        error: 'Vendedor no encontrado',
        code: 'NOT_FOUND'
      });

      const nuevaCamiseta = new Camiseta(titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, vendedor);

      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId });
        if (categoria) nuevaCamiseta.categoria = categoria;
      }

      em.persist(nuevaCamiseta);
      await em.flush();

      const camisetaCompleta = await em.findOneOrFail(Camiseta, { id: nuevaCamiseta.id }, { populate: ['categoria', 'vendedor'] });

      res.status(201).json({
        success: true,
        message: 'Operación create realizada correctamente.',
        data: camisetaCompleta
      });
    } catch (error) {
      console.error('Error en create camiseta:', error);
      res.status(500).json({ success: false, message: 'Error al crear camiseta' });
    }
  }

  // PUT /api/camisetas/:id
  static async update(req: Request, res: Response) {
    try {
      const updateSchema = z.object({
        titulo: z.string().min(2).optional(),
        descripcion: z.string().min(5).optional(),
        precioInicial: z.coerce.number().positive().optional(),
        stock: z.coerce.number().int().min(0).optional(),
        estado: CamisetaController.EstadoEnum.optional()
      });

      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo actualizar camiseta: datos inválidos.',
          error: 'Datos inválidos',
          code: 'INVALID_DATA',
          details: parseResult.error.issues
        });
      }

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const camiseta = await em.findOne(Camiseta, { id: Number(req.params.id) });
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo actualizar camiseta: camiseta no encontrada.',
          error: 'Camiseta no encontrada',
          code: 'NOT_FOUND'
        });
      }

      Object.assign(camiseta, parseResult.data);
      await em.flush();

      const camisetaCompleta = await em.findOneOrFail(Camiseta, { id: camiseta.id }, { populate: ['categoria', 'vendedor'] });

      res.json({
        success: true,
        message: 'Operación update realizada correctamente.',
        data: camisetaCompleta
      });
    } catch (error) {
      console.error('Error en update camiseta:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar camiseta' });
    }
  }

  // DELETE /api/camisetas/:id
  static async delete(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const camiseta = await em.findOne(Camiseta, { id: Number(req.params.id) });
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo eliminar camiseta: camiseta no encontrada.',
          error: 'Camiseta no encontrada',
          code: 'NOT_FOUND'
        });
      }

      camiseta.estado = EstadoCamiseta.INACTIVA;
      await em.flush();

      res.json({
        success: true,
        message: 'Operación delete realizada correctamente.'
      });
    } catch (error) {
      console.error('Error en delete camiseta:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar camiseta' });
    }
  }

  // POST /api/camisetas/publicar
  static async publicarParaVenta(req: Request, res: Response) {
    try {
      // ✅ VALIDACIÓN AGREGADA
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No se pudo publicar camiseta: no autorizado.',
          error: 'No autorizado',
          code: 'UNAUTHORIZED'
        });
      }
      if (req.user.rol !== UsuarioRol.USUARIO) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo publicar camiseta: solo usuarios pueden publicar camisetas.',
          error: 'Rol no permitido',
          code: 'FORBIDDEN'
        });
      }

      const publicarSchema = z.object({
        titulo: z.string().min(2),
        descripcion: z.string().min(5).optional(),
        equipo: z.string().min(2),
        temporada: z.string().min(2),
        talle: CamisetaController.TalleEnum,
        condicion: CamisetaController.CondicionEnum,
        imagen: z.string().min(5).optional(),
        precioInicial: z.coerce.number().positive(),
        esSubasta: z.boolean().optional(),
        stock: z.coerce.number().int().min(1).optional(),
        categoriaId: z.coerce.number().int().optional(),
        fechaFinSubasta: z.coerce.date().optional().refine(
          (date) => !date || date > new Date(),
          { message: 'La fecha de fin de subasta debe ser futura' }
        )
      });

      const parseResult = publicarSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo publicar camiseta: datos inválidos.',
          error: 'Datos inválidos',
          code: 'INVALID_DATA',
          details: parseResult.error.issues
        });
      }

      const { titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, esSubasta, stock, categoriaId, fechaFinSubasta } = parseResult.data;

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const vendedor = await em.findOne(Usuario, { id: req.user.id, activo: true });
      if (!vendedor) return res.status(404).json({
        success: false,
        message: 'No se pudo publicar camiseta: vendedor no encontrado o inactivo.',
        error: 'Vendedor no encontrado o inactivo',
        code: 'NOT_FOUND'
      });

      const nuevaCamiseta = new Camiseta(
        titulo,
        descripcion || `Camiseta ${equipo} temporada ${temporada}`,
        equipo,
        temporada,
        talle,
        condicion,
        imagen || '',
        precioInicial,
        vendedor
      );

      nuevaCamiseta.esSubasta = esSubasta ?? false;
      nuevaCamiseta.stock = stock ?? 1;
      nuevaCamiseta.estado = esSubasta ? EstadoCamiseta.EN_SUBASTA : EstadoCamiseta.DISPONIBLE;

      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId, activa: true });
        if (categoria) nuevaCamiseta.categoria = categoria;
      }

      em.persist(nuevaCamiseta);
      await em.flush();

      const camisetaCompleta = await em.findOneOrFail(Camiseta, { id: nuevaCamiseta.id }, { populate: ['categoria', 'vendedor'] });

      res.status(201).json({
        success: true,
        message: `Operación publicarParaVenta realizada correctamente.`,
        data: camisetaCompleta,
        detalles: {
          tipo_venta: esSubasta ? 'subasta' : 'precio_fijo',
          precio_inicial: precioInicial,
          stock: nuevaCamiseta.stock,
          estado: nuevaCamiseta.estado,
          fecha_fin_subasta: fechaFinSubasta || null
        }
      });
    } catch (error) {
      console.error('Error en publicarParaVenta:', error);
      res.status(500).json({ success: false, message: 'Error al publicar camiseta' });
    }
  }

  // GET /api/camisetas/stats - devuelve precio mínimo y máximo de camisetas activas
  static async stats(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const knex = (orm.em as any).getConnection().getKnex();
      const row = await knex('camiseta')
        .whereNot('estado', 'INACTIVA')
        .select(knex.raw('MIN(precio_inicial) as minPrecio'), knex.raw('MAX(precio_inicial) as maxPrecio'))
        .first();

      const minPrecio = row?.minPrecio ? Number(row.minPrecio) : null;
      const maxPrecio = row?.maxPrecio ? Number(row.maxPrecio) : null;

      res.json({
        success: true,
        message: 'Operación stats realizada correctamente.',
        data: { minPrecio, maxPrecio }
      });
    } catch (error) {
      console.error('Error en stats camisetas:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener estadísticas de camisetas: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'STATS_ERROR'
      });
    }
  }

  // GET /api/camisetas/seleccion - Para formularios de descuentos
  static async getSeleccion(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const camisetas = await em.find(
        Camiseta, 
        { estado: EstadoCamiseta.DISPONIBLE },
        { 
          populate: ['categoria', 'vendedor'],
          orderBy: { titulo: 'ASC' }
        }
      );

      const seleccion = camisetas.map(c => ({
        id: c.id,
        titulo: c.titulo,
        equipo: c.equipo,
        temporada: c.temporada,
        precio: c.precioInicial,
        imagen: c.imagen,
        categoria: c.categoria ? {
          id: c.categoria.id,
          nombre: c.categoria.nombre
        } : null
      }));

      res.json({
        success: true,
        message: 'Operación getSeleccion realizada correctamente.',
        data: seleccion
      });
    } catch (error) {
      console.error('Error en getSeleccion camisetas:', error);
      res.status(500).json({
        success: false,
        message: 'No se pudo obtener selección de camisetas: error interno.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'GETSELECCION_ERROR'
      });
    }
  }
}
