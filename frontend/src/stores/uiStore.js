import { create } from 'zustand';

export const useUiStore = create((set, get) => ({
  // Search & Filter
  searchQuery: '',
  priceFilter: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriceFilter: (filter) => set({ priceFilter: filter }),

  // Bookmarks / Saved listings
  savedIds: [],

  toggleSaved: (id, e) => {
    if (e) e.stopPropagation();
    const { savedIds } = get();
    if (savedIds.includes(id)) {
      set({ savedIds: savedIds.filter(saved => saved !== id) });
    } else {
      set({ savedIds: [...savedIds, id] });
    }
  },

  // Recent Searches
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
  
  addSearchQuery: (query) => {
    if (!query || !query.trim()) return;
    const { recentSearches } = get();
    const filtered = recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
    const updated = [query.trim(), ...filtered].slice(0, 5); // Keep last 5
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    set({ recentSearches: updated });
  },
}));
