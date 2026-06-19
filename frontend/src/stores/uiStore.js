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
}));
