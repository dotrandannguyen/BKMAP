import { create } from 'zustand';
import { loadListings, saveListings, clearListings, resetToBaseline } from '../mockData';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000/api`;
};

export const useListingStore = create((set, get) => ({
  listings: [],
  selectedListingId: '',
  editingListing: null,

  // Fetch phòng trọ từ Backend API
  fetchRooms: async (filters = {}) => {
    try {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams();

      if (filters.limit) {
        params.append('limit', filters.limit);
      } else {
        params.append('limit', '50');
      }
      if (filters.page) params.append('page', filters.page);
      if (filters.ownerEmail) params.append('ownerEmail', filters.ownerEmail);
      if (filters.search) params.append('search', filters.search);

      // Ánh xạ priceFilter thành minPrice/maxPrice
      if (filters.priceFilter && filters.priceFilter !== 'all') {
        if (filters.priceFilter === 'under-1m') {
          params.append('maxPrice', '999999');
        } else if (filters.priceFilter === '1m-2m') {
          params.append('minPrice', '1000000');
          params.append('maxPrice', '2000000');
        } else if (filters.priceFilter === '2m-3m') {
          params.append('minPrice', '2000000');
          params.append('maxPrice', '3000000');
        } else if (filters.priceFilter === 'above-3m') {
          params.append('minPrice', '3000001');
        }
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiUrl}/rooms${queryString}`);
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
          distanceDUT: room.distanceToBk || 0.8,
          address: room.address,
          rating: 5.0,
          images: room.images?.length > 0
            ? room.images.map(img => img.imageUrl)
            : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
          host: {
            name: room.owner?.userName || room.creator?.userName || (room.creator?.email ? room.creator.email.split('@')[0] : 'Chủ trọ'),
            avatar: room.creator?.avatar || '',
            phone: room.owner?.phoneNumber || 'Liên hệ qua ứng dụng'
          },
          amenities: room.features?.map(f => f.feature?.name || '').filter(Boolean) || [],
          description: room.description || '',
          status: room.status || 'AVAILABLE',
          area: room.area,
          lat: Number(room.latitude),
          lng: Number(room.longitude),
          ownerEmail: room.creator?.email || 'guest@example.com',
          electricityPrice: room.electricityPrice,
          waterPrice: room.waterPrice,
          otherCosts: room.otherCosts,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }));
        set({ listings: roomsFromApi });
      } else {
        console.warn('API /rooms thất bại, fallback LocalStorage');
        set({ listings: loadListings() });
      }
    } catch (err) {
      console.error('Lỗi load phòng từ server:', err);
      set({ listings: loadListings() });
    }
  },

  // Thêm hoặc cập nhật listing
  addListing: (newListing, userEmail) => {
    if (!newListing.lat || !newListing.lng) {
      newListing.lat = 16.07380 + (Math.random() - 0.5) * 0.01;
      newListing.lng = 108.14990 + (Math.random() - 0.5) * 0.01;
    }
    const now = new Date().toISOString();
    newListing.updatedAt = now;

    const { listings } = get();
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
    set({ listings: updated });
    saveListings(updated);
  },

  // Xóa phòng trọ (gọi API Backend)
  deleteListing: async (id) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/rooms/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Lỗi từ server khi xóa phòng');
    }

    const { listings, selectedListingId } = get();
    const updated = listings.filter(item => item.id !== id);
    const newSelectedId = selectedListingId === id ? (updated[0]?.id || '') : selectedListingId;
    set({ listings: updated, selectedListingId: newSelectedId });
    saveListings(updated);
  },

  // Toggle trạng thái phòng
  toggleStatus: (id) => {
    const { listings } = get();
    const updated = listings.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Hoạt động' ? 'Bảo trì' : 'Hoạt động';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    set({ listings: updated });
    saveListings(updated);
  },

  // Chọn phòng trọ để xem chi tiết
  selectListing: (id) => {
    set({ selectedListingId: id });
  },

  // Set phòng trọ cần chỉnh sửa
  setEditingListing: (listing) => {
    set({ editingListing: listing });
  },

  // Xóa sạch dữ liệu
  clearAll: () => {
    const empty = clearListings();
    set({ listings: empty, selectedListingId: '' });
    alert('🗑️ Đã xóa sạch dữ liệu trọ trong LocalStorage.');
  },

  // Reset dữ liệu mẫu
  resetData: () => {
    const baseline = resetToBaseline();
    set({ listings: baseline, selectedListingId: 'loft-skyline' });
    alert('🔄 Đã khôi phục dữ liệu phòng trọ mẫu thành công.');
  },
}));
