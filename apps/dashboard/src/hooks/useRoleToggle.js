import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing seller/supplier role toggling and enabling
 */
export function useRoleToggle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Check if user has both seller and supplier profiles (hybrid user)
  const hasSellerRole = user?.hasSellerProfile || user?.role === 'SELLER' || user?.role === 'HYBRID';
  const hasSupplierRole = user?.hasSupplierProfile || user?.role === 'SUPPLIER' || user?.role === 'HYBRID';
  const isHybrid = hasSellerRole && hasSupplierRole;

  /**
   * Toggle between seller and supplier views
   * This just changes the UI mode, doesn't affect backend
   */
  const toggleView = (currentMode) => {
    if (!isHybrid) return;
    
    if (currentMode === 'seller') {
      navigate('/supplier');
    } else {
      navigate('/dashboard');
    }
  };

  /**
   * Enable supplier role for a seller
   */
  const enableSupplier = async () => {
    setLoading(true);
    setError(null);

    try {
      // Navigate to supplier activation page
      // This page will handle the supplier profile setup
      navigate('/supplier/profile');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to enable supplier role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enable seller role for a supplier
   */
  const enableSeller = async () => {
    setLoading(true);
    setError(null);

    try {
      // Navigate to business setup page
      // This page will handle the business setup
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to enable seller role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    hasSellerRole,
    hasSupplierRole,
    isHybrid,
    toggleView,
    enableSupplier,
    enableSeller,
    loading,
    error
  };
}
