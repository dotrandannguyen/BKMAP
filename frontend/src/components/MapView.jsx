import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';

export default function MapView() {
  const navigate = useNavigate();
  const { listings, selectListing, fetchRooms } = useListingStore();
  const { searchQuery, setSearchQuery, priceFilter, setPriceFilter, savedIds, toggleSaved } = useUiStore();

  const onSelectListing = (id) => {
    selectListing(id);
    navigate(`/rooms/${id}`);
  };
  const [selectedPin, setSelectedPin] = useState(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Sync selectedPin when listings load or change
  useEffect(() => {
    if (listings.length > 0) {
      const exists = listings.find((item) => item.id === selectedPin?.id);
      setSelectedPin(exists || listings[0]);
    } else {
      setSelectedPin(null);
    }
  }, [listings]);

  // Sync parent search query state
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced API call to fetch rooms based on searchQuery and priceFilter
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRooms({
        search: searchQuery,
        priceFilter: priceFilter,
        limit: 100
      });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, priceFilter, fetchRooms]);

  const filteredListings = listings;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map centered at DUT: 16.07380, 108.14990
    const map = L.map(mapContainerRef.current, {
      zoomControl: false // Disable default zoom control to use our custom UI
    }).setView([16.07380, 108.14990], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Custom school icon for DUT
    const schoolHtml = `
      <div class="flex flex-col items-center select-none cursor-default">
        <div class="w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center animate-bounce-slow" style="animation: bounceSlow 3s infinite;">
          <span class="material-symbols-outlined text-white" style="font-size: 18px;">school</span>
        </div>
        <div class="bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow-sm -mt-0.5 border border-white whitespace-nowrap">
          ĐH BÁCH KHOA
        </div>
      </div>
    `;

    const schoolIcon = L.divIcon({
      html: schoolHtml,
      className: 'school-div-icon-main',
      iconSize: [80, 45],
      iconAnchor: [40, 45]
    });

    L.marker([16.07380, 108.14990], { icon: schoolIcon }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // 2. Render Markers and Sync Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear old markers
    markersLayer.clearLayers();

    if (filteredListings.length === 0) return;

    filteredListings.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const isSelected = selectedPin?.id === item.id;
      const priceText = formatVND(item.price);

      // Custom div marker tag (Zillow/Airbnb style)
      const htmlContent = `
        <div class="flex flex-col items-center">
          <div class="px-2.5 py-1 rounded-full text-[10px] font-black shadow-md border transition-all ${
            isSelected
              ? 'bg-amber-500 text-white border-amber-600 scale-110 ring-4 ring-amber-500/20 z-[1000]'
              : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 hover:scale-105'
          }">
            ${priceText}
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-1 shadow-sm ${isSelected ? 'bg-amber-500' : 'bg-indigo-600'}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlContent,
        className: 'custom-div-icon',
        iconSize: [60, 30],
        iconAnchor: [30, 30]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon })
        .on('click', () => {
          handleMarkerClick(item);
        });

      markersLayer.addLayer(marker);
    });

    // Auto-fit bounds if we have listings and no specific selection
    if (filteredListings.length > 0 && !selectedPin) {
      const bounds = L.latLngBounds(filteredListings.map(item => [item.lat, item.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [filteredListings, selectedPin]);

  // Handle marker selection and scroll list
  const handleMarkerClick = (item) => {
    setSelectedPin(item);
    
    // Pan map to marker center
    const map = mapInstanceRef.current;
    if (map && item.lat && item.lng) {
      map.panTo([item.lat, item.lng], { animate: true });
    }

    const element = document.getElementById(`list-card-${item.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleLocateDUT = () => {
    mapInstanceRef.current?.setView([16.07380, 108.14990], 15);
  };

  const formatVND = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'Tr';
    }
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-103px)] overflow-hidden bg-white animate-fade-in relative">
      {/* 1. Left Search and List Panel */}
      <div className={`w-full md:w-[45%] lg:w-[40%] flex flex-col h-full bg-slate-50 border-r border-slate-200/80 z-20 ${showMobileMap ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Filters and Search box */}
        <div className="p-4 bg-white border-b border-slate-200/60 shadow-xs space-y-3">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5">
            <span className="material-symbols-outlined text-outline text-lg mr-2 select-none">search</span>
            <input
              className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-on-surface"
              placeholder="Tìm kiếm khu vực, tên phòng trọ..."
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
            />
            {localSearch && (
              <button 
                onClick={() => { setLocalSearch(''); setSearchQuery(''); }}
                className="material-symbols-outlined text-[#ef4444] text-lg hover:bg-slate-200 rounded-full p-1 cursor-pointer"
              >
                close
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                priceFilter === 'all'
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
              }`}
            >
              Mọi giá thuê
            </button>
            <button
              onClick={() => setPriceFilter('under-1m')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                priceFilter === 'under-1m'
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
              }`}
            >
              Dưới 1Tr VNĐ
            </button>
            <button
              onClick={() => setPriceFilter('1m-2m')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                priceFilter === '1m-2m'
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
              }`}
            >
              1Tr - 2Tr VNĐ
            </button>
            <button
              onClick={() => setPriceFilter('2m-3m')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                priceFilter === '2m-3m'
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
              }`}
            >
              2Tr - 3Tr VNĐ
            </button>
            <button
              onClick={() => setPriceFilter('above-3m')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                priceFilter === 'above-3m'
                  ? 'bg-primary text-white shadow-sm shadow-primary/10'
                  : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
              }`}
            >
              Trên 3Tr VNĐ
            </button>
          </div>
        </div>

        {/* Count result summary description */}
        <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
          <p className="text-xs font-semibold text-slate-700">
            {filteredListings.length} phòng trọ đã tìm thấy tại Đà Nẵng
          </p>
          {priceFilter !== 'all' || localSearch !== '' ? (
            <button
              onClick={() => {
                setLocalSearch('');
                setSearchQuery('');
                setPriceFilter('all');
              }}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>

        {/* Listings Result Track */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {filteredListings.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">gavel</span>
              <p className="text-sm font-semibold text-on-surface-variant">Không tìm thấy phòng trọ nào phù hợp</p>
              <p className="text-xs text-outline">Hãy thử thay đổi từ khóa hoặc mức giá lọc khác.</p>
            </div>
          ) : (
            filteredListings.map((item) => {
              const isSelected = selectedPin?.id === item.id;
              return (
                <div
                  id={`list-card-${item.id}`}
                  key={item.id}
                  onClick={() => handleMarkerClick(item)}
                  className={`bg-white rounded-3xl p-4 gap-4 flex shadow-sm border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/10 bg-indigo-50/10'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Aspect Cover */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img
                      className="w-full h-full object-cover"
                      alt={item.title}
                      src={item.images[0]}
                      referrerPolicy="no-referrer"
                    />
                    {item.verified && (
                      <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        OK
                      </span>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold text-primary uppercase bg-primary-container/10 px-2 py-0.5 rounded-full">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span>{item.rating}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm sm:text-base font-bold text-on-surface line-clamp-1">
                        {item.title}
                      </h3>
                      
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                          {item.address}
                        </p>
                        {item.distanceText && (
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">directions_walk</span>
                            {item.distanceText}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-outline">Giá phòng</span>
                        <p className="text-sm sm:text-base font-black text-primary leading-none">
                          {formatVND(item.price)}
                          <span className="text-[10px] font-medium text-on-surface-variant">/th</span>
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(item.id);
                        }}
                        className="bg-primary/5 text-primary text-xs font-black px-3.5 py-2 rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Map Panel (Real Leaflet Map) */}
      <div className={`flex-1 h-full relative ${showMobileMap ? 'flex' : 'hidden md:flex'}`}>
        <div ref={mapContainerRef} id="leaflet-map" className="absolute inset-0 bg-slate-100"></div>

        {/* Interactive Floating Card for Selected Pin */}
        {selectedPin && (
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl z-[1000] border border-slate-100 flex gap-3 animate-slide-up pointer-events-auto">
            {/* Aspect Cover mini */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
              <img
                className="w-full h-full object-cover"
                alt={selectedPin.title}
                src={selectedPin.images[0]}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Snippet summary */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-primary/10 text-primary font-extrabold px-1.5 py-0.5 rounded-md">
                    {selectedPin.type}
                  </span>
                  <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span>{selectedPin.rating}</span>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-on-surface truncate pr-2">{selectedPin.title}</h4>
                <p className="text-[10px] text-on-surface-variant truncate">{selectedPin.address}</p>
                {selectedPin.distanceText && (
                  <p className="text-[9px] text-slate-500 truncate flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-[10px]">directions_walk</span>
                    {selectedPin.distanceText}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="text-xs font-black text-primary leading-none">
                  {formatVND(selectedPin.price)}/th
                </span>
                <button
                  onClick={() => onSelectListing(selectedPin.id)}
                  className="bg-primary text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl hover:bg-primary-container transition-all cursor-pointer"
                >
                  XEM PHÒNG
                </button>
              </div>
            </div>

            {/* Close pop up button */}
            <button
              onClick={() => setSelectedPin(null)}
              className="absolute -top-2 -right-2 bg-on-surface text-white hover:bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center shadow-lg border border-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        )}

        {/* Map Control Floating tools */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <div className="bg-white rounded-2xl p-1.5 shadow-lg border border-slate-100 flex flex-col">
            <button 
              onClick={handleLocateDUT}
              className="material-symbols-outlined text-on-surface-variant hover:text-primary p-2 cursor-pointer transition-colors"
              title="Reset center to ĐH Bách Khoa DUT"
            >
              my_location
            </button>
            <button 
              onClick={handleZoomIn}
              className="material-symbols-outlined text-on-surface-variant hover:text-primary p-2 cursor-pointer transition-colors" 
              title="Zoom In"
            >
              add
            </button>
            <button 
              onClick={handleZoomOut}
              className="material-symbols-outlined text-on-surface-variant hover:text-primary p-2 cursor-pointer transition-colors" 
              title="Zoom Out"
            >
              remove
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Pill (Bản đồ <> Thống kê) */}
      <div className="md:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 bg-on-surface text-white shadow-xl rounded-full px-5 py-3 flex gap-3 text-xs font-extrabold border border-white/10 active:scale-95 transition-transform pointer-events-auto">
        <button
          onClick={() => setShowMobileMap(false)}
          className={`flex items-center gap-1.5 ${!showMobileMap ? 'text-sky-300' : 'text-slate-200'}`}
        >
          <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
          <span>Danh sách</span>
        </button>
        <span className="text-slate-500">|</span>
        <button
          onClick={() => setShowMobileMap(true)}
          className={`flex items-center gap-1.5 ${showMobileMap ? 'text-sky-300' : 'text-slate-200'}`}
        >
          <span className="material-symbols-outlined text-sm">map</span>
          <span>Bản đồ</span>
        </button>
      </div>

      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
