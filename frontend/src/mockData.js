export const BASELINE_LISTINGS = [];

export function loadListings() {
  const data = localStorage.getItem('bks_map_listings');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  localStorage.setItem('bks_map_listings', JSON.stringify([]));
  return [];
}

export function saveListings(listings) {
  localStorage.setItem('bks_map_listings', JSON.stringify(listings));
}

export function clearListings() {
  localStorage.setItem('bks_map_listings', JSON.stringify([]));
  return [];
}

export function resetToBaseline() {
  localStorage.setItem('bks_map_listings', JSON.stringify(BASELINE_LISTINGS));
  return BASELINE_LISTINGS;
}
