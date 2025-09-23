import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Home } from './pages/user/Home'; // Nueva importación
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          {/* Header */}
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
              <Link className="navbar-brand" to="/">
                🏆 Camisetas Retro
              </Link>
              <div className="navbar-nav ms-auto">
                <Link className="nav-link" to="/login">Login</Link>
                <Link className="nav-link" to="/register">Register</Link>
              </div>
            </div>
          </nav>

          {/* Rutas */}
          <main className="container my-4">
            <Routes>
              <Route path="/" element={<Home />} /> {/* Actualizado */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-light text-center py-3 mt-5">
            <p>&copy; 2024 Camisetas Retro Marketplace</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
