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

  const { login: authLogin } = useAuth(); // ✅ Usar AuthContext
  const navigate = useNavigate();

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email.includes('@')) {
      setError('Ingrese un email válido');
      return false;
    }
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(''); 

    try {
      console.log('🔍 Intentando login...'); 
      
      const response = await authService.login(formData);
      console.log('✅ Login exitoso:', response); 
      
      if (response.success && response.data) {
        const { token, usuario } = response.data;
        
        // ✅ USAR AUTHCONTEXT EN LUGAR DE LOCALSTORAGE DIRECTO
        authLogin(usuario, token);
        
        console.log('✅ AuthContext actualizado, redirigiendo...'); 
        navigate('/');
      } else {
        console.error('❌ Estructura de respuesta inesperada:', response); 
        setError('Error en la respuesta del servidor');
        setTimeout(() => setError(''), 5000);
      }
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error en login:', error);
        setError(error.message || 'Error de conexión');
        setTimeout(() => setError(''), 5000);
      } else {
        setError('Error de conexión');
        setTimeout(() => setError(''), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
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

                {/* removed duplicate password input */}

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
                  {loading ? (<span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'>Ingresando...</span>) : 'Ingresar'}
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
