import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { loadListings, saveListings, clearListings, resetToBaseline } from './mockData';

// Component Imports
import Navbar from './components/Navbar';
import HomepageView from './components/HomepageView';
import MapView from './components/MapView';
import DetailView from './components/DetailView';
import DashboardView from './components/DashboardView';
import CreateListingView from './components/CreateListingView';

// Page Imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPage from './pages/UserPage';

// Route guard: chuyển hướng về /login nếu chưa đăng nhập
function RequireAuth({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [editingListing, setEditingListing] = useState(null);
  
  // User Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Search state across components
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');

  // Bookmark / Saved listings tracking
  const [savedIds, setSavedIds] = useState([]);

  // Initial load — luôn lấy data thật từ Backend thay vì LocalStorage mock
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api'
          ? import.meta.env.VITE_API_URL
          : `http://${window.location.hostname}:3000/api`;

        const res = await fetch(`${apiUrl}/rooms?limit=50`);
        if (res.ok) {
          const json = await res.json();
          const raw = json.data?.data || json.data || [];
          const roomsFromApi = raw.map(room => ({
            id: room.id,
            title: room.title,
            type: room.type || 'Phòng trọ',
            price: room.price,
            priceUSD: Math.round(room.price / 24800),
            distanceText: `Cách ĐHBK ${room.distanceToBk || 0.8}km`,
            address: room.address,
            rating: 5.0,
            images: room.images?.length > 0
              ? room.images.map(img => img.imageUrl)
              : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
            host: { name: 'Chủ trọ', phone: 'Liên hệ qua ứng dụng' },
            amenities: room.features?.map(f => f.feature?.name || '').filter(Boolean) || [],
            description: room.description || '',
            status: room.status || 'AVAILABLE',
            area: room.area,
            lat: Number(room.latitude),
            lng: Number(room.longitude),
            ownerEmail: room.creator?.email || 'guest@example.com',
          }));
          setListings(roomsFromApi);
        } else {
          console.warn('API /rooms thất bại, fallback LocalStorage');
          setListings(loadListings());
        }
      } catch (err) {
        console.error('Lỗi load phòng từ server:', err);
        setListings(loadListings());
      }
    };

    fetchRooms();

    // Khôi phục phiên đăng nhập khi F5
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(localStorage.getItem('userEmail') || '');
      setUserName(localStorage.getItem('userName') || '');
    }
  }, []);

  // Sync back state
  const handleAddListing = (newListing) => {
    // Inject realistic coordinate around DUT if not provided
    if (!newListing.lat || !newListing.lng) {
      newListing.lat = 16.07548 + (Math.random() - 0.5) * 0.01;
      newListing.lng = 108.14983 + (Math.random() - 0.5) * 0.01;
    }
    // Add timestamps and ownership
    const now = new Date().toISOString();
    newListing.updatedAt = now;
    
    const existingIndex = listings.findIndex(l => l.id === newListing.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...listings];
      updated[existingIndex] = newListing;
    } else {
      newListing.createdAt = now;
      newListing.ownerEmail = userEmail || 'guest@example.com';
      updated = [newListing, ...listings];
    }
    
    setListings(updated);
    saveListings(updated);
  };

  const handleEditListing = (id) => {
    const listingToEdit = listings.find(l => l.id === id);
    if (listingToEdit) {
      setEditingListing(listingToEdit);
      navigate('/create');
    }
  };

  const handleDeleteListing = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }
      const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
      
      const res = await fetch(`${apiUrl}/rooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Lỗi từ server khi xóa phòng');
      }

      // Xóa thành công, cập nhật state UI và mockData
      const updated = listings.filter((item) => item.id !== id);
      setListings(updated);
      saveListings(updated); // Fallback local

      if (selectedListingId === id) {
        const remaining = updated[0]?.id || '';
        setSelectedListingId(remaining);
      }
    } catch (error) {
      alert("Không thể xóa phòng: " + error.message);
      console.error("Lỗi xóa phòng:", error);
    }
  };

  const handleToggleStatus = (id) => {
    const updated = listings.map((item) => {
      if (item.id === id) {
        const nextStatus = item.status === 'Hoạt động' ? 'Bảo trì' : 'Hoạt động';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setListings(updated);
    saveListings(updated);
  };

  const handleSelectListing = (id) => {
    setSelectedListingId(id);
    navigate(`/rooms/${id}`);
  };

  const toggleSaved = (id, e) => {
    e.stopPropagation();
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(saved => saved !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  // Auth Callbacks
  const handleLoginSuccess = (email, name) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setUserName(name || email.split('@')[0]);
    navigate('/profile');
  };

  const handleRegisterSuccess = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
    navigate('/');
  };

  // Database Management Callbacks
  const handleClearAll = () => {
    const empty = clearListings();
    setListings(empty);
    setSelectedListingId('');
    alert('🗑️ Đã xóa sạch dữ liệu trọ trong LocalStorage. Ứng dụng hiện đang ở trạng thái rỗng.');
  };

  const handleResetData = () => {
    const baseline = resetToBaseline();
    setListings(baseline);
    setSelectedListingId('loft-skyline');
    alert('🔄 Đã khôi phục dữ liệu phòng trọ mẫu thành công.');
  };

  // Find active listing or fallback to first available
  const activeListing = listings.find((item) => item.id === selectedListingId) || listings[0];

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-[#0b1c30]">
      {/* Dynamic Header Navbar Bar */}
      <Navbar
        savedCount={savedIds.length}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        userName={userName}
        onClearAll={handleClearAll}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      {/* Main View Port */}
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={
            <HomepageView
              listings={listings}
              onSelectListing={handleSelectListing}
              setSearchQuery={setSearchQuery}
              setPriceFilter={setPriceFilter}
              toggleSaved={toggleSaved}
              savedIds={savedIds}
              onResetData={handleResetData}
            />
          } />

          <Route path="/map" element={
            <MapView
              listings={listings}
              onSelectListing={handleSelectListing}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              toggleSaved={toggleSaved}
              savedIds={savedIds}
            />
          } />

          <Route path="/rooms/:id" element={
            <DetailView
              listing={activeListing}
              toggleSaved={toggleSaved}
              savedIds={savedIds}
            />
          } />

          <Route path="/dashboard" element={
            <DashboardView
              listings={listings.filter((item) => item.ownerEmail === userEmail || item.ownerEmail === 'guest@example.com')}
              onDeleteListing={handleDeleteListing}
              onToggleStatus={handleToggleStatus}
              onSelectListing={handleSelectListing}
              onEditListing={handleEditListing}
              onResetData={handleResetData}
              onClearAll={handleClearAll}
              onCreateNew={() => { setEditingListing(null); navigate('/create'); }}
            />
          } />

          <Route path="/create" element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <CreateListingView
                onAddListing={handleAddListing}
                initialData={editingListing}
              />
            </RequireAuth>
          } />

          <Route path="/login" element={
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
            />
          } />

          <Route path="/register" element={
            <RegisterPage
              onRegisterSuccess={handleRegisterSuccess}
            />
          } />

          <Route path="/profile" element={
            <UserPage
              userEmail={userEmail || 'sinhvien@dut.udn.vn'}
              userName={userName}
              listings={listings}
              savedIds={savedIds}
              onSelectListing={handleSelectListing}
              onLogout={handleLogout}
            />
          } />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
