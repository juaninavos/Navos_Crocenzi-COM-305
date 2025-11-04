import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navigation } from './components/common/Navigation';
import { ToastProvider } from './providers/ToastProvider';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Home } from './pages/user/Home';
import { Catalog } from './pages/user/Catalog';
import { AdminDashboard } from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement'; // ✅ AGREGAR

import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import MyProductsPage from './pages/user/MyProductsPage';

// ✅ IMPORTAR páginas de subastas
import { AuctionsPage } from './pages/auction/AuctionsPage';
import { AuctionDetailPage } from './pages/auction/AuctionDetailPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
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
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-products" element={<MyProductsPage />} />
                <Route path="/admin" element={<AdminDashboard />} /> {/* ✅ AGREGAR */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/categories" element={<CategoriesManagement />} /> {/* ✅ AGREGAR */}

                {/* ✅ RUTAS DE SUBASTAS */}
                <Route path="/auctions" element={<AuctionsPage />} />
                <Route path="/auctions/:id" element={<AuctionDetailPage />} />
              </Routes>
            </main>
          </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
