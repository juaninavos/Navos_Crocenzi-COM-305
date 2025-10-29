import { useState, useCallback } from 'react';
import { ofertaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { CreateOfertaData, Oferta } from '../types';

export const useBids = (subastaId?: number) => {
  const { usuario } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ ACTUALIZAR: Aceptar usuarioId como tercer parámetro
  const crearOferta = useCallback(async (
    subastaId: number, 
    monto: number,
    usuarioId: number // ✅ AGREGAR
  ): Promise<Oferta | null> => {
    try {
      setLoading(true);
      setError(null);

      const data: CreateOfertaData = {
        monto,
        usuarioId, // ✅ Usar el usuarioId recibido por parámetro
        subastaId
      };

      console.log('📤 Creando oferta con datos:', data);

      const oferta = await ofertaService.create(data);
      
      console.log('✅ Oferta creada exitosamente:', oferta);
      
      return oferta;
    } catch (err: any) {
      console.error('❌ Error al crear oferta:', err);
      
      // Manejar errores específicos del backend
      const mensaje = err.response?.data?.message || 
                     err.message || 
                     'Error al realizar la oferta';
      
      setError(mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Quitar 'usuario' de las dependencias

  const obtenerMisOfertas = useCallback(async (): Promise<Oferta[]> => {
    if (!usuario) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const ofertas = await ofertaService.getMisOfertas(usuario.id);
      return ofertas;
    } catch (err) {
      console.error('Error al obtener mis ofertas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar ofertas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // ✅ AGREGAR: Cargar ofertas de una subasta específica
  const cargarOfertas = useCallback(async () => {
    if (!subastaId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await ofertaService.getBySubasta(subastaId);
      setOfertas(data);
    } catch (err) {
      console.error('Error al cargar ofertas:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar ofertas');
    } finally {
      setLoading(false);
    }
  }, [subastaId]);

  return {
    ofertas,
    crearOferta,
    obtenerMisOfertas,
    cargarOfertas,
    loading,
    error
  };
};