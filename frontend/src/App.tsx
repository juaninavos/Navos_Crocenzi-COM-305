import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navigation } from './components/common/Navigation';

// Pages - ✅ USAR NAMED IMPORTS (con llaves)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Home } from './pages/user/Home';
import { Catalog } from './pages/user/Catalog';
import { AdminDashboard } from './pages/admin/Dashboard'; // ✅ CAMBIAR a AdminDashboard

// Estos SÍ usan export default
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} /> {/* ✅ CAMBIAR */}
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
