import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek role user ke backend
    apiFetch<{ role: string }>('/api/user')
      .then((res: any) => setRole(res.role))
      .catch(() => setRole(null)) // Jika gagal (belum login), set null
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary font-semibold">
        Memverifikasi akses...
      </div>
    );
  }

  // Jika belum login, lempar ke halaman login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Jika role-nya tidak diizinkan, lempar ke halaman yang sesuai
  if (!allowedRoles.includes(role)) {
    // Jika Admin nyasar ke Dashboard Owner, lempar ke Kasir
    if (role === 'ADMIN') return <Navigate to="/kasir" replace />;
    // Jika Owner nyasar ke halaman aneh, lempar ke Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Jika role diizinkan, tampilkan halaman
  return <>{children}</>;
}