import { useState, useCallback } from 'react';
import { ofertaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { CreateOfertaData, Oferta } from '../types';

export const useBids = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearOferta = useCallback(async (
    subastaId: number, 
    monto: number
  ): Promise<Oferta | null> => {
    if (!usuario) {
      setError('Debes iniciar sesión para hacer ofertas');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const data: CreateOfertaData = {
        monto,
        usuarioId: usuario.id,
        subastaId
      };

      const oferta = await ofertaService.create(data);
      
      return oferta;
    } catch (err: any) {
      console.error('Error al crear oferta:', err);
      
      // Manejar errores específicos del backend
      const mensaje = err.response?.data?.message || 
                     err.message || 
                     'Error al realizar la oferta';
      
      setError(mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, [usuario]);

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

  return {
    crearOferta,
    obtenerMisOfertas,
    loading,
    error
  };
};