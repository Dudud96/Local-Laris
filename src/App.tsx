import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initAuth, useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Stores from './pages/Stores';
import CaraBelanja from './pages/CaraBelanja';

// Dashboard Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerOrders from './pages/buyer/BuyerOrders';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

import SellerSettings from './pages/seller/SellerSettings';

export default function App() {
  const { loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    if (unsubscribe) {
      return () => unsubscribe();
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">Memuat aplikasi...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/cara-belanja" element={<CaraBelanja />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Buyer Protected Routes */}
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/buyer" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/buyer/orders" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <BuyerOrders />
            </ProtectedRoute>
          } />
        </Route>

        {/* Dashboard Routes uses separate layouts */}
        <Route path="/seller" element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <AdminLayout role="seller" />
          </ProtectedRoute>
        }>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="settings" element={<SellerSettings />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          {/* add admin specific routes */}
        </Route>

      </Routes>
    </Router>
  );
}
