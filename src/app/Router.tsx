import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/features/matches/components/HomePage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { StandingsPage } from '@/features/standings/components/StandingsPage';
import { ComparatorPage } from '@/features/comparator/components/UserComparator';
import { ProfilePage } from '@/features/users/components/UserProfile';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';
import { ProtectedRoute, AdminRoute } from '@/shared/components/ProtectedRoute';
import { PageLayout } from '@/shared/components/layout/PageLayout';

export function Router() {
  return (
    <PageLayout>
      <Routes>
        {/* Rutas Públicas / Anónimas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Privadas / Autenticadas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/standings"
          element={
            <ProtectedRoute>
              <StandingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <ComparatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Administrador */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageLayout>
  );
}
