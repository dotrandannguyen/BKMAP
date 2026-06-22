import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';
import bgComingSoon from '../assets/bg-coming-soon.jpg';

export default function AllListingsView() {
  const navigate = useNavigate();
  const { listings } = useListingStore();
  const { savedIds, toggleSaved } = useUiStore();
  
  // State
  const [sortType, setSortType] = useState('newest'); // newest, price-asc, price-desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Local helper methods matching the previous views
  const formatVND = (num) => {
    if (!num) return '0';
    return Number(num).toLocaleString('vi-VN');
  };

  const formatAddressShort = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return address;
  };

  // Fetch all listings initially (or rely on App.jsx fetching)
  // Let's assume App.jsx already calls fetchRooms() but we can ensure it here.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter and Sort
  const sortedListings = useMemo(() => {
    // Clone array for sorting
    let sorted = [...listings];
    
    if (sortType === 'newest') {
      // Assuming ID or createdAt reflects newest, reverse array as a fallback
      // For now, let's reverse to show "newest" if they were appended
      sorted = sorted.reverse(); 
    } else if (sortType === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  }, [listings, sortType]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedListings.length / itemsPerPage));
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedListings.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedListings, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20 pt-20 relative overflow-hidden">
      {/* Faded Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bgComingSoon})` }}
      />
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-0 pt-6 relative z-10">
        
        {/* Header and Sorting Bar (Shopee Style) */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
              Tất cả phòng trọ ({sortedListings.length})
            </h2>
            
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500 mr-2 hidden md:inline">Sắp xếp theo</span>
              <button
                onClick={() => { setSortType('newest'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  sortType === 'newest' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mới nhất
              </button>
              <button
                onClick={() => { setSortType('price-asc'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  sortType === 'price-asc' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Giá: Thấp đến Cao
              </button>
              <button
                onClick={() => { setSortType('price-desc'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  sortType === 'price-desc' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Giá: Cao đến Thấp
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Listings */}
        {paginatedListings.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
            <h3 className="text-lg font-bold text-gray-600 mt-4">Không tìm thấy phòng trọ nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {paginatedListings.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/rooms/${item.id}`)}
                className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm flex flex-col group border border-gray-200/60 hover:-translate-y-1"
              >
                {/* Cover Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={item.title}
                    src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Badges on Top */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 max-w-[90%]">
                    {item.verified && (
                      <span className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Xác Thực
                      </span>
                    )}
                    {item.tag && !item.verified && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Favorite Toggle button */}
                  <button
                    onClick={(e) => toggleSaved(item.id, e)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors cursor-pointer ${
                      savedIds.includes(item.id)
                        ? 'bg-white/90 text-red-500 shadow-sm'
                        : 'bg-black/20 hover:bg-black/40 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: savedIds.includes(item.id) ? "'FILL' 1, 'wght' 600" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                </div>

                {/* Summary Metadata */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h4>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-base font-bold text-primary leading-none flex items-baseline truncate">
                      {formatVND(item.price)}
                      <span className="text-[10px] font-normal text-gray-500 ml-1">/tháng</span>
                    </p>
                    
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 truncate">
                      <span className="material-symbols-outlined text-[13px] text-gray-400 shrink-0">location_on</span>
                      <span className="truncate">{formatAddressShort(item.address)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Simple logic: show first, last, current, and +/- 1 from current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 border'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
