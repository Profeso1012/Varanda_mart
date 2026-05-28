import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerApi } from '../lib/axios';

const nextRouteByRole = {
  SELLER: '/pricing',
  SUPPLIER: '/supplier/profile',
};

export function useRoleAdd() {
  const navigate = useNavigate();
  const { applyAuthPayload } = useAuth();
  const [addingRole, setAddingRole] = useState(false);
  const [roleAddError, setRoleAddError] = useState(null);

  const syncAuthState = async () => {
    const { data } = await sellerApi.get('/auth/me');
    applyAuthPayload(data.data);
  };

  const addRole = async (addRoleValue, options = {}) => {
    setAddingRole(true);
    setRoleAddError(null);

    try {
      try {
        await sellerApi.post('/auth/role/add', { addRole: addRoleValue });
      } catch (err) {
        if (err.response?.data?.error?.code !== 'CONFLICT') {
          const message = err.response?.data?.error?.message || 'Could not add this role.';
          setRoleAddError(message);
          throw err;
        }
      }

      await syncAuthState();
      navigate(options.nextRoute || nextRouteByRole[addRoleValue] || '/dashboard');
    } finally {
      setAddingRole(false);
    }
  };

  return { addRole, addingRole, roleAddError };
}
