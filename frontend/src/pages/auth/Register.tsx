 import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { RegisterData } from '../../types';

export const Register = () => {
  const [formData, setFormData] = useState<RegisterData>({
    nombre: '',
    apellido: '',
    email: '',
    contrasena: '',
    direccion: '',
    telefono: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterData>>({});
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});
    // Validación frontend
    let valid = true;
    const newFieldErrors: Partial<RegisterData> = {};
    if (!formData.nombre.trim()) {
      newFieldErrors.nombre = 'El nombre es obligatorio';
      valid = false;
    }
    if (!formData.apellido.trim()) {
      newFieldErrors.apellido = 'El apellido es obligatorio';
      valid = false;
    }
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
    } else if (formData.contrasena.length < 6) {
      newFieldErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      valid = false;
    }
    if (!formData.direccion.trim()) {
      newFieldErrors.direccion = 'La dirección es obligatoria';
      valid = false;
    }
    if (!formData.telefono.trim()) {
      newFieldErrors.telefono = 'El teléfono es obligatorio';
      valid = false;
    } else if (!/^\d{7,15}$/.test(formData.telefono)) {
      newFieldErrors.telefono = 'El teléfono debe ser numérico y válido';
      valid = false;
    }
    setFieldErrors(newFieldErrors);
    if (!valid) {
      setIsLoading(false);
      return;
    }
    try {
      const authResponse = await authService.register(formData);
      login(authResponse.usuario, authResponse.token);
      setSuccess('¡Cuenta creada con éxito! Redirigiendo...');
      setTimeout(() => {
        setSuccess('');
        navigate('/');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      if (error instanceof Error) {
        setError(error.message || 'Error de conexión');
      } else {
        setError('Error de conexión');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="w-1/2">
                <input
                  name="nombre"
                  type="text"
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.nombre ? ' border-red-500' : ' border-gray-300'}`}
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                />
                {fieldErrors.nombre && (
                  <div className="text-red-600 text-xs mt-1">{fieldErrors.nombre}</div>
                )}
              </div>
              <div className="w-1/2">
                <input
                  name="apellido"
                  type="text"
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.apellido ? ' border-red-500' : ' border-gray-300'}`}
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                />
                {fieldErrors.apellido && (
                  <div className="text-red-600 text-xs mt-1">{fieldErrors.apellido}</div>
                )}
              </div>
            </div>
            
            <input
              name="email"
              type="email"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.email ? ' border-red-500' : ' border-gray-300'}`}
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.email}</div>
            )}
            
            <input
              name="contrasena"
              type="password"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.contrasena ? ' border-red-500' : ' border-gray-300'}`}
              placeholder="Contraseña"
              value={formData.contrasena}
              onChange={handleChange}
            />
            {fieldErrors.contrasena && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.contrasena}</div>
            )}
            
            <input
              name="direccion"
              type="text"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.direccion ? ' border-red-500' : ' border-gray-300'}`}
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleChange}
            />
            {fieldErrors.direccion && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.direccion}</div>
            )}
            
            <input
              name="telefono"
              type="tel"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500${fieldErrors.telefono ? ' border-red-500' : ' border-gray-300'}`}
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
            />
            {fieldErrors.telefono && (
              <div className="text-red-600 text-xs mt-1">{fieldErrors.telefono}</div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};