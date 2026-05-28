import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import { AuthProvider }           from './context/AuthContext'
import ProtectedRoute             from './components/ProtectedRoute'

import LandingPage                from './pages/LandingPage'
import RegisterPage               from './pages/auth/RegisterPage'
import LoginPage                  from './pages/auth/LoginPage'
import VerifyEmailPage            from './pages/auth/VerifyEmailPage'
import RoleSelectPage             from './pages/auth/RoleSelectPage'
import ForgotPasswordPage         from './pages/auth/ForgotPasswordPage'
import BusinessSetupPage          from './pages/setup/BusinessSetupPage'
import PricingPage                from './pages/pricing/PricingPage'
import CheckoutPage               from './pages/pricing/CheckoutPage'
import SellerDashboardPage        from './pages/dashboard/SellerDashboardPage'
import SupplierDashboardPage      from './pages/dashboard/SupplierDashboardPage'
import ProductsListPage           from './pages/products/ProductsListPage'
import EditProductPage            from './pages/products/EditProductPage'
import CategoriesPage             from './pages/categories/CategoriesPage'
import MarketplacePage            from './pages/marketplace/MarketplacePage'
import SupplierActivationPage     from './pages/supplier/SupplierActivationPage'
import { useAuth }                from './context/AuthContext'
import { hasSupplierProfile }     from './lib/authRoutes'

// eslint-disable-next-line react-refresh/only-export-components
const SellerRoute = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

// eslint-disable-next-line react-refresh/only-export-components
const SupplierProductsRoute = () => {
  const { user } = useAuth();

  return hasSupplierProfile(user)
    ? <ProductsListPage mode="supplier" />
    : <SupplierActivationPage />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<LandingPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/role/select" element={
            <SellerRoute><RoleSelectPage /></SellerRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pricing"         element={<PricingPage />} />
          <Route path="/checkout"        element={<CheckoutPage />} />
          <Route path="/setup" element={
            <SellerRoute><BusinessSetupPage /></SellerRoute>
          } />

          {/* Seller dashboard */}
          <Route path="/dashboard" element={<SellerRoute><SellerDashboardPage /></SellerRoute>} />

          {/* Seller products */}
          <Route path="/products" element={
            <SellerRoute><ProductsListPage mode="seller" /></SellerRoute>
          } />
          <Route path="/products/new" element={
            <SellerRoute><EditProductPage mode="seller" /></SellerRoute>
          } />
          <Route path="/products/:id/edit" element={
            <SellerRoute><EditProductPage mode="seller" /></SellerRoute>
          } />
          <Route path="/categories" element={
            <SellerRoute><CategoriesPage /></SellerRoute>
          } />

          {/* Dropship marketplace */}
          <Route path="/marketplace" element={
            <SellerRoute><MarketplacePage /></SellerRoute>
          } />

          {/* Supplier */}
          <Route path="/supplier" element={
            <SellerRoute><SupplierDashboardPage /></SellerRoute>
          } />
          <Route path="/supplier/profile" element={
            <SellerRoute><SupplierActivationPage /></SellerRoute>
          } />
          <Route path="/supplier/products" element={
            <SellerRoute><SupplierProductsRoute /></SellerRoute>
          } />
          <Route path="/supplier/products/new" element={
            <SellerRoute><EditProductPage mode="supplier" /></SellerRoute>
          } />
          <Route path="/supplier/products/:id/edit" element={
            <SellerRoute><EditProductPage mode="supplier" /></SellerRoute>
          } />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
