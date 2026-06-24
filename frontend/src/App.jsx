import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Store Imports
import { useAuthStore } from './stores/authStore';
import { useListingStore } from './stores/listingStore';
import { useUiStore } from './stores/uiStore';

// Component Imports
import Navbar from './components/Navbar';
import HomepageView from './components/HomepageView';
import MapView from './components/MapView';
import DetailView from './components/DetailView';
import DashboardView from './components/DashboardView';
import CreateListingView from './components/CreateListingView';
import AllListingsView from './components/AllListingsView';

// Page Imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPage from './pages/UserPage';

// Route guard: chuyển hướng về /login nếu chưa đăng nhập
function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
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
      <Navbar />

      <main className="flex-1 pb-16 md:pb-0">
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
          <Route path="/profile" element={
              <UserPage />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
