import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useToast from '../../hooks/useToast';

// Pequeño componente que escucha eventos 401 globales para mostrar toast y redirigir al login
export const Auth401Listener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      // Debounce simple para evitar múltiples toasts/redirects en ráfaga
      if (now - lastFiredRef.current < 1000) return;
      lastFiredRef.current = now;

      showToast('Sesión expirada. Volvé a iniciar sesión.', { variant: 'warning', title: 'Autenticación' });
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    };

    window.addEventListener('app:auth-401', handler);
    return () => {
      window.removeEventListener('app:auth-401', handler);
    };
  }, [navigate, location.pathname, showToast]);

  return null;
};

export default Auth401Listener;
