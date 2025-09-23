import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginData } from '../../types'; // Cambiado a "import type"

export const Login = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Llamar al backend
      const response = await authService.login(formData);
      
      if (response.success) {
        // Login exitoso
        login(response.data.usuario, response.data.token);
        
        // Redirigir según el rol
        if (response.data.usuario.rol === 'administrador') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(response.message || 'Error al hacer login');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">🔐 Login</h3>
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
                  disabled={loading}
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
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
