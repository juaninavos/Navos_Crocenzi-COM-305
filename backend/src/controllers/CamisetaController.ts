import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Camiseta, Talle, CondicionCamiseta, EstadoCamiseta } from '../entities/Camiseta.js';
import { Usuario, UsuarioRol } from '../entities/Usuario.js';
import { Categoria } from '../entities/Categoria.js';
import '../types/auth.js'; // req.user tipado

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
        esSubasta: z.preprocess((val) => {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return val;
        }, z.boolean().optional())
      });

      const parseResult = filtrosSchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, errors: parseResult.error.issues });
      }

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

  type FiltrosCamiseta = z.infer<typeof filtrosSchema> & { estado: { $ne: EstadoCamiseta } };
  const filtros: FiltrosCamiseta = { estado: { $ne: EstadoCamiseta.INACTIVA }, ...parseResult.data };

  const camisetas = await em.find(Camiseta, filtros, { populate: ['categoria', 'vendedor'] });

  res.json({ success: true, data: camisetas, count: camisetas.length });
    } catch (error) {
      console.error('Error en getAll camisetas:', error);
      res.status(500).json({ success: false, message: 'Error al obtener camisetas' });
    }
  }

  // GET /api/camisetas/:id
  static async getOne(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      const camiseta = await em.findOne(Camiseta, { id: Number(req.params.id) }, { populate: ['categoria', 'vendedor'] });

      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({ success: false, message: 'Camiseta no encontrada' });
      }

      res.json({ success: true, data: camiseta });
    } catch (error) {
      console.error('Error en getOne camiseta:', error);
      res.status(500).json({ success: false, message: 'Error al obtener camiseta' });
    }
  }

  // POST /api/camisetas
  static async create(req: Request, res: Response) {
    try {
      if (req.user.rol !== UsuarioRol.USUARIO) {
        return res.status(403).json({ success: false, message: 'Solo usuarios pueden publicar camisetas' });
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
        return res.status(400).json({ success: false, errors: parseResult.error.issues });
      }

      const { titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, categoriaId } = parseResult.data;

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const vendedor = await em.findOne(Usuario, { id: req.user.id });
      if (!vendedor) return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });

      const nuevaCamiseta = new Camiseta(titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, vendedor);

      if (categoriaId) {
        const categoria = await em.findOne(Categoria, { id: categoriaId });
        if (categoria) nuevaCamiseta.categoria = categoria;
      }

      em.persist(nuevaCamiseta);
      await em.flush();

      const camisetaCompleta = await em.findOneOrFail(Camiseta, { id: nuevaCamiseta.id }, { populate: ['categoria', 'vendedor'] });

      res.status(201).json({ success: true, data: camisetaCompleta });
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
        return res.status(400).json({ success: false, errors: parseResult.error.issues });
      }

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const camiseta = await em.findOne(Camiseta, { id: Number(req.params.id) });
      if (!camiseta || camiseta.estado === EstadoCamiseta.INACTIVA) {
        return res.status(404).json({ success: false, message: 'Camiseta no encontrada' });
      }

      Object.assign(camiseta, parseResult.data);
      await em.flush();

      const camisetaCompleta = await em.findOneOrFail(Camiseta, { id: camiseta.id }, { populate: ['categoria', 'vendedor'] });

      res.json({ success: true, data: camisetaCompleta });
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
        return res.status(404).json({ success: false, message: 'Camiseta no encontrada' });
      }

      camiseta.estado = EstadoCamiseta.INACTIVA;
      await em.flush();

      res.json({ success: true, message: 'Camiseta eliminada correctamente' });
    } catch (error) {
      console.error('Error en delete camiseta:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar camiseta' });
    }
  }

  // POST /api/camisetas/publicar
  static async publicarParaVenta(req: Request, res: Response) {
    try {
      if (req.user.rol !== UsuarioRol.USUARIO) {
        return res.status(403).json({ success: false, message: 'Solo usuarios pueden publicar camisetas' });
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
        return res.status(400).json({ success: false, errors: parseResult.error.issues });
      }

      const { titulo, descripcion, equipo, temporada, talle, condicion, imagen, precioInicial, esSubasta, stock, categoriaId, fechaFinSubasta } = parseResult.data;

      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();

      const vendedor = await em.findOne(Usuario, { id: req.user.id, activo: true });
      if (!vendedor) return res.status(404).json({ success: false, message: 'Vendedor no encontrado o inactivo' });

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
        data: camisetaCompleta,
        message: `Camiseta ${esSubasta ? 'publicada en subasta' : 'publicada para venta'} correctamente`,
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
}
