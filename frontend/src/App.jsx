import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Store Imports
import { useAuthStore } from './stores/authStore';
import { useListingStore } from './stores/listingStore';
import { useUiStore } from './stores/uiStore';

// Component Imports
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded components (Code Splitting)
const HomepageView = lazy(() => import('./components/HomepageView'));
const MapView = lazy(() => import('./components/MapView'));
const DetailView = lazy(() => import('./components/DetailView'));
const DashboardView = lazy(() => import('./components/DashboardView'));
const CreateListingView = lazy(() => import('./components/CreateListingView'));
const AllListingsView = lazy(() => import('./components/AllListingsView'));

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Loading Fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// Route guard: chuyển hướng về /login nếu chưa đăng nhập
function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Route guard: chỉ ADMIN mới vào được
function RequireAdmin({ children }) {
  const { isLoggedIn, userRole } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (userRole !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const fetchRooms = useListingStore((s) => s.fetchRooms);
  const loadSavedIds = useUiStore((s) => s.loadSavedIds);

  // Khởi tạo: khôi phục phiên đăng nhập + tải danh sách phòng
  useEffect(() => {
    restoreSession();
    fetchRooms();
  }, [restoreSession, fetchRooms]);

  useEffect(() => {
    loadSavedIds();
  }, [isLoggedIn, loadSavedIds]);

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-[#0b1c30]">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomepageView />} />
            <Route path="/all-listings" element={<AllListingsView />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/rooms/:id" element={<DetailView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/create" element={
              <RequireAuth>
                <CreateListingView />
              </RequireAuth>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<UserPage />} />
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
