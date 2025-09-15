import { Request, Response } from 'express';
import { Usuario, UsuarioRol } from '../entities/Usuario.js';
import { Camiseta } from '../entities/Camiseta.js';
import { Compra } from '../entities/Compra.js';
import { Subasta } from '../entities/Subasta.js';
import '../types/auth.js';

export class AdminController {
  
  // GET /api/admin/dashboard
  static async getDashboard(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;

      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores'
        });
      }

      // Estadísticas generales
      const totalUsuarios = await orm.em.count(Usuario, { activo: true, rol: UsuarioRol.USUARIO });
      const totalCamisetas = await orm.em.count(Camiseta, {});
      const totalCompras = await orm.em.count(Compra, {});
      const totalSubastas = await orm.em.count(Subasta, { activa: true });

      // ✅ CORREGIDO: Tipar parámetros del reduce
      const compras = await orm.em.find(Compra, {});
      const ingresosTotales = compras.reduce((suma: number, compra: Compra) => suma + Number(compra.total), 0);

      // Top 5 camisetas más vendidas
      const camisetas = await orm.em.find(Camiseta, {}, {
        populate: ['compras'],
        orderBy: { fechaCreacion: 'DESC' }
      });

      // ✅ CORREGIDO: Tipar parámetros del map y sort
      const camisetasMasVendidas = camisetas
        .map((camiseta: Camiseta) => ({
          ...camiseta,
          totalVentas: camiseta.compras?.length || 0
        }))
        .sort((a: any, b: any) => b.totalVentas - a.totalVentas)
        .slice(0, 5);

      // Ventas por mes - simplificado
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      const comprasRecientes = await orm.em.find(Compra, {
        fechaCompra: { $gte: seisMesesAtras }
      });

      // ✅ CORREGIDO: Tipar parámetros del reduce
      const ventasPorMes = comprasRecientes.reduce((acc: Record<string, any>, compra: Compra) => {
        const fecha = compra.fechaCompra;
        const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
        
        if (!acc[key]) {
          acc[key] = { mes: fecha.getMonth() + 1, anio: fecha.getFullYear(), cantidad: 0, ingresos: 0 };
        }
        
        acc[key].cantidad += 1;
        acc[key].ingresos += Number(compra.total);
        
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          resumen: {
            totalUsuarios,
            totalCamisetas,
            totalCompras,
            totalSubastas,
            ingresosTotales
          },
          camisetasMasVendidas,
          ventasPorMes: Object.values(ventasPorMes)
        },
        message: 'Dashboard obtenido correctamente'
      });
    } catch (error) {
      console.error('Error en getDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener dashboard',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // GET /api/admin/usuarios
  static async gestionarUsuarios(req: Request, res: Response) {
    try {
      const orm = req.app.locals.orm;
      
      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores'
        });
      }

      const usuarios = await orm.em.find(Usuario, 
        { rol: UsuarioRol.USUARIO }, 
        { 
          populate: ['camisetasVendidas', 'compras'],
          orderBy: { fechaRegistro: 'DESC' }
        }
      );

      const usuariosConStats = usuarios.map((usuario: Usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        email_normalized: usuario.email_normalized,
        activo: usuario.activo,
        fechaRegistro: usuario.fechaRegistro,
        estadisticas: {
          camisetasVendidas: usuario.camisetasVendidas.length,
          comprasRealizadas: usuario.compras.length,
          fechaUltimaActividad: usuario.fechaRegistro
        }
      }));

      res.json({
        success: true,
        data: usuariosConStats,
        count: usuarios.length,
        message: 'Usuarios obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error en gestionarUsuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  // PUT /api/admin/usuarios/:id/toggle-estado
  static async toggleEstadoUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const orm = req.app.locals.orm;
      
      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores'
        });
      }

      const usuario = await orm.em.findOne(Usuario, { id: parseInt(id), rol: UsuarioRol.USUARIO });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (usuario.rol === UsuarioRol.ADMINISTRADOR) {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar el estado de un administrador'
        });
      }

      const estadoAnterior = usuario.activo;
      usuario.activo = !usuario.activo;

      await orm.em.persistAndFlush(usuario);

      res.json({
        success: true,
        data: usuario,
        message: `Usuario ${estadoAnterior ? 'desactivado' : 'activado'} correctamente`,
        motivo: motivo || 'Sin motivo especificado'
      });
    } catch (error) {
      console.error('Error en toggleEstadoUsuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del usuario'
      });
    }
  }

  // GET /api/admin/reportes/ventas
  static async reporteVentas(req: Request, res: Response) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const orm = req.app.locals.orm;
      
      if (req.user.rol !== UsuarioRol.ADMINISTRADOR) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores'
        });
      }

      let filtros: any = {};
      
      if (fechaInicio && fechaFin) {
        filtros.fechaCompra = {
          $gte: new Date(fechaInicio as string),
          $lte: new Date(fechaFin as string)
        };
      }

      const compras = await orm.em.find(Compra, filtros, {
        populate: ['camiseta', 'camiseta.vendedor', 'comprador'],
        orderBy: { fechaCompra: 'DESC' }
      });

      // ✅ CORREGIDO: Tipar parámetros del reduce
      const ingresosTotales = compras.reduce((suma: number, compra: Compra) => suma + Number(compra.total), 0);
      const promedioVenta = compras.length > 0 ? ingresosTotales / compras.length : 0;
      
      const ventasPorEstado = compras.reduce((acc: Record<string, number>, compra: Compra) => {
        acc[compra.estado] = (acc[compra.estado] || 0) + 1;
        return acc;
      }, {});

      const resumen = {
        totalVentas: compras.length,
        ingresosTotales,
        promedioVenta,
        ventasPorEstado
      };

      res.json({
        success: true,
        data: {
          compras,
          resumen
        },
        message: 'Reporte de ventas generado correctamente'
      });
    } catch (error) {
      console.error('Error en reporteVentas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de ventas'
      });
    }
  }
}