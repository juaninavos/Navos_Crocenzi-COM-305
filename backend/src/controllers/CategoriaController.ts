import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { Categoria } from '../entities/Categoria';
import { Camiseta } from '../entities/Camiseta';
import { UsuarioRol } from '../entities/Usuario';

export class CategoriaController {
  
  // GET /api/categorias
  static async getAll(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const categorias = await em.find(Categoria, { activa: true });
      
      res.json({
        success: true,
        data: categorias,
        count: categorias.length,
        message: 'Categorías obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error en getAll categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // GET /api/categorias/:id
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const categoria = await em.findOne(Categoria, { id: parseInt(id), activa: true });
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        success: true,
        data: categoria
      });
    } catch (error) {
      console.error('Error en getOne categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categoría',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // POST /api/categorias
  static async create(req: Request, res: Response) {
    try {
      // ✅ VALIDACIÓN AGREGADA
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
      }

      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden crear categorías'
        });
      }

      const { nombre, descripcion } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        });
      }

      if (nombre.length < 2 || nombre.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 2 y 100 caracteres'
        });
      }
      
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const existeCategoria = await em.findOne(Categoria, { nombre: nombre.trim() });
      if (existeCategoria) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
      
      const nuevaCategoria = new Categoria(nombre.trim(), descripcion?.trim());
      
      em.persist(nuevaCategoria);
      await em.flush();

      res.status(201).json({
        success: true,
        data: nuevaCategoria,
        message: 'Categoría creada correctamente'
      });
    } catch (error) {
      console.error('Error en create categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear categoría',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // PUT /api/categorias/:id
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const categoria = await em.findOne(Categoria, { id: parseInt(id), activa: true });
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      if (nombre !== undefined) {
        if (!nombre || nombre.length < 2 || nombre.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'El nombre debe tener entre 2 y 100 caracteres'
          });
        }

        const existeCategoria = await em.findOne(Categoria, { 
          nombre: nombre.trim(),
          id: { $ne: parseInt(id) }
        });
        if (existeCategoria) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otra categoría con ese nombre'
          });
        }

        categoria.nombre = nombre.trim();
      }

      if (descripcion !== undefined) {
        categoria.descripcion = descripcion?.trim() || null;
      }

      await em.flush();

      res.json({
        success: true,
        data: categoria,
        message: 'Categoría actualizada correctamente'
      });
    } catch (error) {
      console.error('Error en update categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // DELETE /api/categorias/:id (soft delete)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orm = req.app.locals.orm as MikroORM;
      const em = orm.em.fork();
      
      const categoria = await em.findOne(Categoria, { id: parseInt(id), activa: true });
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      const camisetasAsociadas = await em.count(Camiseta, { categoria: categoria });
      if (camisetasAsociadas > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${camisetasAsociadas} camisetas asociadas`
        });
      }

      categoria.activa = false;
      await em.flush();

      res.json({
        success: true,
        message: 'Categoría eliminada correctamente'
      });
    } catch (error) {
      console.error('Error en delete categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar categoría',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
