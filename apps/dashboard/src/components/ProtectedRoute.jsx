import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, initialized } = useAuth();

  // Still checking session — show nothing (or a spinner)
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#22925B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — send to login
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
