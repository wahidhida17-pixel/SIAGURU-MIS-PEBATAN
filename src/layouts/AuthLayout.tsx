import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <LoadingSpinner text="Memuat aplikasi..." />
      </div>
    );
  }

  if (isAuthenticated) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'guru') return <Navigate to="/guru/dashboard" replace />;
  }

  return <Outlet />;
};
