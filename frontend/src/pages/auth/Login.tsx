import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginData } from '../../types';

export const Login = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    contrasena: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // ✅ MANTENER: authService.login devuelve directamente { usuario, token }
      const authResponse = await authService.login(formData);
      
      // ✅ MANTENER: Ya no hay .success o .data, es directo
      login(authResponse.usuario, authResponse.token);
      
      navigate('/');
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    // ✅ USAR Bootstrap (versión de tu compañero) pero mantener la lógica nuestra
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">🔐 Iniciar Sesión</h3>
            </div>
            <div className="card-body">
              
              {/* Mostrar error si existe */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="contrasena" className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
