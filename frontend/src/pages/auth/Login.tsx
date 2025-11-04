import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { authService, ApiAuthError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginData } from '../../types';
import useToast from '../../hooks/useToast';

export const Login = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    contrasena: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; contrasena?: string }>({});
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});
    // Validación frontend
    let valid = true;
    const newFieldErrors: { email?: string; contrasena?: string } = {};
    if (!formData.email.trim()) {
      newFieldErrors.email = 'El email es obligatorio';
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      newFieldErrors.email = 'El formato de email no es válido';
      valid = false;
    }
    if (!formData.contrasena.trim()) {
      newFieldErrors.contrasena = 'La contraseña es obligatoria';
      valid = false;
    }
    setFieldErrors(newFieldErrors);
    if (!valid) {
      setIsLoading(false);
      return;
    }
    try {
      const authResponse = await authService.login(formData);
      login(authResponse.usuario, authResponse.token);
      setSuccess('¡Ingreso exitoso! Redirigiendo...');
      showToast('Bienvenido/a', { variant: 'success' });
      setTimeout(() => {
        setSuccess('');
        navigate('/');
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiAuthError) {
        setError('Email o contraseña incorrectos');
        showToast('Email o contraseña incorrectos', { variant: 'danger' });
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Email o contraseña incorrectos');
        showToast('Email o contraseña incorrectos', { variant: 'danger' });
      } else if (error instanceof Error) {
        setError(error.message || 'Error de conexión');
        showToast(error.message || 'Error de conexión', { variant: 'danger' });
      } else {
        setError('Error de conexión');
        showToast('Error de conexión', { variant: 'danger' });
      }
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
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="contrasena" className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className={`form-control${fieldErrors.contrasena ? ' is-invalid' : ''}`}
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.contrasena && (
                    <div className="invalid-feedback">{fieldErrors.contrasena}</div>
                  )}
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
