import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Camiseta, Talle, CondicionCamiseta, EstadoCamiseta } from '../entities/Camiseta';

export class CamisetaController {
  
  // GET /api/camisetas - Con filtros
  static async getAll(req: Request, res: Response) {
    try {
      const { equipo, temporada, talle, condicion } = req.query;
      
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      // Construir filtros dinámicamente
      const filtros: any = { estado: { $ne: EstadoCamiseta.INACTIVA } };
      
      console.log('🔍 Filtros recibidos:', { equipo, temporada, talle, condicion });
      
      // Filtro de equipo - SIMPLIFICADO
      if (equipo) {
        const equipoValue = decodeURIComponent(equipo as string);
        console.log('🔍 Buscando equipo:', equipoValue);
        
        // Prueba con búsqueda exacta primero
        filtros.equipo = equipoValue;
        console.log('🔍 Filtros aplicados:', filtros);
      }
      
      if (temporada) {
        filtros.temporada = temporada;
      }
      
      if (talle) {
        filtros.talle = talle;
      }
      
      if (condicion) {
        filtros.condicion = condicion;
      }

      console.log('🔍 Ejecutando query con filtros:', filtros);

      const camisetas = await em.find('Camiseta', filtros, {
        populate: ['categoria', 'vendedor']
      });

      console.log(`🔍 Resultados encontrados: ${camisetas.length}`);

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
        error: error instanceof Error ? error.message : String(error)  // ← Corregir esta línea
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
        populate: ['categoria', 'vendedor']  // ← Quitar 'subastas' por ahora
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
      const { 
        titulo, descripcion, equipo, temporada, talle, condicion, 
        imagen, precioInicial, esSubasta, stock, categoriaId, vendedorId 
      } = req.body;
      
      // Validaciones básicas
      if (!titulo || !equipo || !temporada || !talle || !precioInicial || !vendedorId) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: titulo, equipo, temporada, talle, precioInicial, vendedorId'
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
      
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const nuevaCamiseta = new Camiseta(
        titulo,
        descripcion,
        equipo,
        temporada,
        talle as Talle,
        condicion as CondicionCamiseta,
        imagen,
        precioInicial,
        vendedorId
      );
      
      nuevaCamiseta.esSubasta = esSubasta || false;
      nuevaCamiseta.stock = stock || 1;
      if (categoriaId) nuevaCamiseta.categoria = em.getReference('Categoria', categoriaId);

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
}