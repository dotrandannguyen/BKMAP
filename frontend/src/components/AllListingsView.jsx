import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';
import bgComingSoon from '../assets/bg-coming-soon.jpg';

export default function AllListingsView() {
  const navigate = useNavigate();
  const { listings, fetchRooms } = useListingStore();
  const { savedIds, toggleSaved } = useUiStore();
  
  // State
  const [sortType, setSortType] = useState('newest'); // newest, price-asc, price-desc
  const [streetFilter, setStreetFilter] = useState('');
  const [priceRange, setPriceRange] = useState('all'); // all, under1.5, 1.5-3, over3
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return address;
  };

  // Fetch all listings initially (or rely on App.jsx fetching)
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRooms();
  }, [fetchRooms]);

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
    return `${Math.floor(diffInDays / 365)} năm trước`;
  };

  // Filter and Sort
  const sortedListings = useMemo(() => {
    // Clone array for sorting
    let sorted = [...listings];
    
    // Apply street filter
    if (streetFilter.trim() !== '') {
      const searchTerms = streetFilter.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      sorted = sorted.filter(item => {
        const addr = (item.address || '').toLowerCase();
        return searchTerms.some(term => addr.includes(term));
      });
    }

    // Apply price filter
    if (priceRange !== 'all') {
      sorted = sorted.filter(item => {
        const price = item.price || 0;
        if (priceRange === 'under1') return price < 1000000;
        if (priceRange === '1-2') return price >= 1000000 && price <= 2000000;
        if (priceRange === '2-3') return price >= 2000000 && price <= 3000000;
        if (priceRange === 'over3') return price > 3000000;
        return true;
      });
    }

    if (sortType === 'newest') {
      sorted.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    } else if (sortType === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  }, [listings, sortType, streetFilter, priceRange]);

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
    <div className="min-h-screen bg-[#f8f9ff] pb-20 pt-6 relative overflow-hidden font-sans">
      {/* Faded Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-0 pointer-events-none bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bgComingSoon})` }}
      />
      
      <div className="w-full px-4 md:px-[30px] pt-2 relative z-10 max-w-[1400px] mx-auto">
        
        {/* Shopee Sort Bar */}
        <div className="bg-slate-100 px-5 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div className="flex items-center flex-wrap gap-2.5 text-[13px] text-slate-600">
            <span className="text-slate-500 font-normal">Sắp xếp theo</span>
            
            <button
              onClick={() => { setSortType('newest'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                sortType === 'newest' ? 'bg-primary text-white font-medium shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Mới Nhất
            </button>

            {/* Price Ascending Button */}
            <button
              onClick={() => { setSortType('price-asc'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                sortType === 'price-asc' ? 'bg-primary text-white font-medium shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Giá</span>
              <span className="material-symbols-outlined text-[14px] font-bold">arrow_upward</span>
            </button>

            {/* Price Descending Button */}
            <button
              onClick={() => { setSortType('price-desc'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                sortType === 'price-desc' ? 'bg-primary text-white font-medium shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>Giá</span>
              <span className="material-symbols-outlined text-[14px] font-bold">arrow_downward</span>
            </button>

            {/* Filter Toggle Button inside Sort Bar */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer border ${
                streetFilter || priceRange !== 'all'
                  ? 'bg-primary text-white border-primary font-medium shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <span>Bộ lọc</span>
              {(streetFilter || priceRange !== 'all') && (
                <span className="bg-white text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>
          </div>
          
          {/* Mini Pagination */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div>
              <span className="text-primary font-semibold">{currentPage}</span>
              <span className="text-slate-500">/{totalPages}</span>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1} 
                className="w-8 h-8 bg-white flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-50 disabled:bg-[#f9f9f9] disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <div className="w-[1px] bg-slate-200 h-8"></div>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages} 
                className="w-8 h-8 bg-white flex items-center justify-center cursor-pointer text-slate-600 hover:bg-slate-50 disabled:bg-[#f9f9f9] disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Listings */}
        {paginatedListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/60 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <h3 className="text-sm font-bold text-slate-500 mt-4">Không tìm thấy phòng trọ nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {paginatedListings.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/rooms/${item.id}`)}
                className="bg-white rounded-3xl overflow-hidden hover:scale-[1.01] hover:shadow-xl border border-slate-200/60 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col group relative shadow-sm"
              >
                {/* Cover Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={item.title}
                    src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Badges on Top */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
                    {item.verified && (
                      <span className="bg-primary text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Xác Thực
                      </span>
                    )}
                    {item.tag && !item.verified && (
                      <span className="bg-secondary text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Bottom gradient overlay with time ago and image count */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/75 to-transparent flex items-end justify-between px-3 pb-2.5 pointer-events-none select-none">
                    <span className="text-white text-[12px] font-bold drop-shadow-md">
                      {getTimeAgo(item.updatedAt || item.createdAt || new Date().toISOString())}
                    </span>
                    {item.images && item.images.length > 0 && (
                      <div className="flex items-center gap-1 text-white text-[12px] font-bold drop-shadow-md">
                        <span>{item.images.length}</span>
                        <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                      </div>
                    )}
                  </div>

                  {/* Favorite Toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(item.id, e);
                    }}
                    className={`absolute top-3 right-3 backdrop-blur-md p-2 rounded-full transition-colors cursor-pointer ${
                      savedIds.includes(item.id) 
                        ? 'bg-white/90 text-red-500 shadow-sm' 
                        : 'bg-white/20 hover:bg-white/40 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: savedIds.includes(item.id) ? "'FILL' 1, 'wght' 600" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                </div>

                {/* Summary Metadata */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                        {item.title}
                      </h4>
                      
                      <p className="text-[17px] font-black text-primary leading-none pt-0.5 pb-1 flex items-baseline">
                        {formatVND(item.price)}
                        <span className="text-[10px] font-bold text-on-surface-variant ml-0.5">/tháng</span>
                      </p>
                      
                      <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0">location_on</span>
                        <span className="line-clamp-2">{formatAddressShort(item.address)}</span>
                      </p>
                      
                      {item.distanceText && (
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 whitespace-nowrap mt-1">
                          <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                          {item.distanceText}
                        </p>
                      )}
                    </div>
                    
                    {/* Host avatar */}
                    {item.host?.avatar ? (
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                          alt={item.host.name || 'Chủ trọ'}
                          className="w-full h-full object-cover"
                          src={item.host.avatar}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                        {item.host?.name ? item.host.name[0] : 'C'}
                      </div>
                    )}
                  </div>

                  {/* Amenity tags */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/15">
                    {item.amenities?.slice(0, 2).map((amenity, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-on-surface-variant px-2.5 py-1 rounded-md font-semibold font-sans">
                        {amenity}
                      </span>
                    ))}
                    {item.amenities?.length > 2 && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold font-sans">
                        +{item.amenities.length - 2} khác
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-1 text-[13px]">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer border ${
                        currentPage === pageNum 
                          ? 'bg-primary text-white border-primary font-medium' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        )}

      </div>

      {/* Filter Modal Popup */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Modal Content */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
                <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                BỘ LỌC TÌM KIẾM
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Area/Street Filter */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-700 mb-3 uppercase tracking-wide">Khu vực / Tên đường</h4>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder="Nhập tên đường..."
                    value={streetFilter}
                    onChange={(e) => { setStreetFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-700 mb-3 uppercase tracking-wide">Khoảng Giá</h4>
                <div className="space-y-2.5">
                  {[
                    { id: 'all', label: 'Tất cả mức giá' },
                    { id: 'under1', label: 'Dưới 1 triệu' },
                    { id: '1-2', label: 'Từ 1 - 2 triệu' },
                    { id: '2-3', label: 'Từ 2 - 3 triệu' },
                    { id: 'over3', label: 'Trên 3 triệu' },
                  ].map((range) => (
                    <label key={range.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="priceRange"
                        checked={priceRange === range.id}
                        onChange={() => { setPriceRange(range.id); setCurrentPage(1); }}
                        className="w-[14px] h-[14px] accent-primary cursor-pointer"
                      />
                      <span className={`text-[13px] ${priceRange === range.id ? 'text-primary font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setStreetFilter('');
                    setPriceRange('all');
                    setCurrentPage(1);
                  }}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg uppercase hover:bg-slate-50 transition-colors"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-2 bg-primary text-white text-[12px] font-bold rounded-lg uppercase hover:bg-primary-container transition-colors shadow-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
