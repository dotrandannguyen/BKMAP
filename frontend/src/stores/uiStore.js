import { create } from 'zustand';
import { toast } from 'react-toastify';

const FAVORITE_STORAGE_KEY = 'favoriteRoomIds';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000/api`;
};

const readLocalFavoriteIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(Boolean))];
  } catch (error) {
    console.error('Failed to parse favoriteRoomIds from localStorage', error);
    return [];
  }
};

const writeLocalFavoriteIds = (ids) => {
  localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify([...new Set(ids.filter(Boolean))]));
};

const mapRoomToListing = (room) => ({
  id: room.id,
  title: room.title,
  type: room.type || 'Phong tro',
  price: room.price,
  priceUSD: Math.round(room.price / 24800),
  distanceText: `Cach DHBK ${room.distanceToBk || 0.8}km`,
  distanceDUT: room.distanceToBk || 0.8,
  address: room.address,
  rating: 5.0,
  images: room.images?.length > 0
    ? room.images.map(img => img.imageUrl)
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
  host: {
    name: room.owner?.userName || room.creator?.userName || (room.creator?.email ? room.creator.email.split('@')[0] : 'Chu tro'),
    avatar: room.creator?.avatar || '',
    phone: room.owner?.phoneNumber || 'Lien he qua ung dung'
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
});

export const useUiStore = create((set, get) => ({
  // Search & Filter
  searchQuery: '',
  priceFilter: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriceFilter: (filter) => set({ priceFilter: filter }),

  // Bookmarks / Saved listings
  savedIds: readLocalFavoriteIds(),
  favoriteRooms: [],
  favoritesLoading: false,

  loadSavedIds: async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      set({
        savedIds: readLocalFavoriteIds(),
        favoriteRooms: [],
        favoritesLoading: false,
      });
      return;
    }

    set({
      savedIds: [],
      favoriteRooms: [],
      favoritesLoading: true,
    });
    try {
      const res = await fetch(`${getApiUrl()}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load favorites');
      }

      const json = await res.json();
      const ids = Array.isArray(json.data?.ids) ? json.data.ids : [];
      const favoriteRooms = Array.isArray(json.data?.rooms)
        ? json.data.rooms.map(mapRoomToListing)
        : [];

      set({
        savedIds: ids,
        favoriteRooms,
        favoritesLoading: false,
      });
    } catch (error) {
      console.error('Failed to load favorite rooms:', error);
      set({
        savedIds: [],
        favoriteRooms: [],
        favoritesLoading: false,
      });
    }
  },

  toggleSaved: async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;

    const token = localStorage.getItem('accessToken');
    const { savedIds, favoriteRooms } = get();
    const isSaved = savedIds.includes(id);
    const nextIds = isSaved
      ? savedIds.filter(saved => saved !== id)
      : [...savedIds, id];

    if (!token) {
      writeLocalFavoriteIds(nextIds);
      set({ savedIds: nextIds, favoriteRooms: [] });
      return;
    }

    set({
      savedIds: nextIds,
      favoriteRooms: isSaved
        ? favoriteRooms.filter(room => room.id !== id)
        : favoriteRooms,
    });

    try {
      const res = await fetch(`${getApiUrl()}/favorites${isSaved ? `/${id}` : ''}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isSaved ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(isSaved ? {} : { body: JSON.stringify({ roomId: id }) }),
      });

      if (!res.ok) {
        throw new Error('Failed to update favorite');
      }

      if (!isSaved) {
        const json = await res.json();
        if (json.data?.room) {
          const mappedRoom = mapRoomToListing(json.data.room);
          set({
            favoriteRooms: [
              mappedRoom,
              ...get().favoriteRooms.filter(room => room.id !== mappedRoom.id),
            ],
          });
        }
      }
    } catch (error) {
      console.error('Failed to update favorite room:', error);
      set({ savedIds, favoriteRooms });
      toast.error('Khong the cap nhat danh sach yeu thich. Vui long thu lai.');
    }
  },

  // Recent Searches
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
  
  addSearchQuery: (query) => {
    if (!query || !query.trim()) return;
    const { recentSearches } = get();
    const filtered = recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
    const updated = [query.trim(), ...filtered].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    set({ recentSearches: updated });
  },
}));
