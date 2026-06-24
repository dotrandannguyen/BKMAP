import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';
import { toast } from 'react-toastify';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DetailView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const listings = useListingStore((s) => s.listings);
  const { savedIds, toggleSaved } = useUiStore();

  const [localListing, setLocalListing] = useState(() => listings.find((item) => item.id === id) || null);
  const [loading, setLoading] = useState(!localListing);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  
  const [showPhone, setShowPhone] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

  useEffect(() => {
    // Sync with store listings cache if loaded
    const cached = listings.find((item) => item.id === id);
    if (cached) {
      setLocalListing(cached);
      if (cached.images && cached.images.length > 0 && !activeImage) {
        setActiveImage(cached.images[0]);
      }
    }

    const fetchListingDetail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
        const res = await fetch(`${apiUrl}/rooms/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy phòng trọ');
        const json = await res.json();
        const room = json.data;

        // Map backend response schema to frontend representation
        const mapped = {
          id: room.id,
          title: room.title,
          type: room.type || 'Phòng trọ',
          price: room.price,
          priceUSD: Math.round(room.price / 24800),
          distanceText: `Từ vị trí trọ hiện tại`,
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
        };

        setLocalListing(mapped);
        if (mapped.images && mapped.images.length > 0 && !activeImage) {
          setActiveImage(mapped.images[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Lỗi tải chi tiết phòng:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchListingDetail();
  }, [id, listings]);

  if (loading && !localListing) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin mb-4"></div>
        <p className="text-sm text-slate-500 font-semibold">Đang tải thông tin phòng trọ...</p>
      </div>
    );
  }

  if (error && !localListing) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:bg-sky-600 transition-all cursor-pointer"
        >
          Trở về trang chủ
        </button>
      </div>
    );
  }

  if (!localListing) return null;

  const listing = localListing;

  const handleCopyPhone = () => {
    const textToCopy = listing.host.phone || '0901234567';
    
    // Fallback function for copying text
    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";  // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Unable to copy', err);
      }
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const handleShare = () => {
    const linkToCopy = window.location.href;

    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Đã sao chép liên kết chia sẻ!');
      } catch (err) {
        console.error('Fallback copy error:', err);
        toast.error('Không thể sao chép liên kết.');
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(linkToCopy)
        .then(() => {
          toast.success('Đã sao chép liên kết chia sẻ!');
        })
        .catch(() => fallbackCopy(linkToCopy));
    } else {
      fallbackCopy(linkToCopy);
    }
  };


  const formatVND = (num) => {
    return num.toLocaleString('vi-VN') + ' VNĐ';
  };

  const galleryImages = listing.images && listing.images.length > 0 ? listing.images : [];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 animate-fade-in pb-28">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-primary font-bold text-sm hover:underline cursor-pointer group"
      >
        <span className="material-symbols-outlined text-sm font-bold group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        <span>Quay lại</span>
      </button>

      {/* Title Header metadata panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-slate-100 text-on-surface text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
              {listing.type}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight leading-tight">
            {listing.title}
          </h1>

          <p className="text-xs md:text-sm text-on-surface-variant font-medium mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-primary">location_on</span>
            {listing.address}
          </p>
        </div>

        {/* Wishlist interactive option */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={(e) => toggleSaved(listing.id, e)}
            className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer text-on-surface bg-white"
          >
            <span className="material-symbols-outlined text-red-500 text-base" style={{ fontVariationSettings: savedIds.includes(listing.id) ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
            <span>{savedIds.includes(listing.id) ? 'Đã lưu' : 'Lưu tin'}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer text-on-surface bg-white"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Picture gallery Shopee-style */}
      {galleryImages.length > 0 && (
        <div className="mb-10 max-w-2xl mx-auto space-y-3">
          {/* Active main container */}
          <div className="rounded-xl overflow-hidden shadow-xs relative bg-slate-100 aspect-[4/3] w-full group border border-slate-200">
            <img
              className="w-full h-full object-cover transition-opacity duration-300"
              alt="Active highlight preview"
              src={activeImage}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Detailed Thumbnail track */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveImage(imgUrl)}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden cursor-pointer relative bg-slate-100 border-2 transition-all ${
                    activeImage === imgUrl ? 'border-primary' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img
                    className="w-full h-full object-cover"
                    alt={`Detail photo ${idx + 1}`}
                    src={imgUrl}
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute inset-0 bg-black/10 transition-opacity ${activeImage === imgUrl ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Splitscreen column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (Host, description, amenities, reviews) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Host Profile Card */}
          <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-slate-200/50">
            <div className="flex items-center gap-4">
              {listing.host?.avatar ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-100 flex-shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    alt={listing.host?.name || 'Người dùng'}
                    src={listing.host.avatar}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 bg-indigo-600 text-white flex items-center justify-center font-black text-lg uppercase shadow-sm flex-shrink-0">
                  {listing.host?.name ? listing.host.name[0] : 'C'}
                </div>
              )}
              <div>
                
                <h3 className="text-base font-bold text-on-surface mt-0.5">{listing.host?.name || 'Người dùng'}</h3>
                <p className="text-xs text-on-surface-variant font-medium">{listing.host?.role || 'Người dùng'}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">description</span>
              Giới thiệu phòng trọ
            </h2>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/65">
              <p className="text-sm font-semibold text-on-surface-variant leading-relaxed text-justify">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Amenities grid Checklist */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">room_service</span>
              Tiện ích cao cấp đi kèm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-6 rounded-3xl border border-slate-200/65">
              {listing.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-full">check</span>
                  <span className="font-semibold">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Costs Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">payments</span>
              Chi phí dịch vụ khác
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-6 rounded-3xl border border-slate-200/65">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary font-bold bg-primary/10 p-1.5 rounded-full">electric_bolt</span>
                <div>
                  <div className="text-[10px] uppercase font-bold text-outline">Tiền điện</div>
                  <div className="text-sm font-semibold text-on-surface">
                    {listing.electricityPrice ? listing.electricityPrice : 'Trao đổi khi liên hệ'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-sky-500 font-bold bg-sky-50 p-1.5 rounded-full">water_drop</span>
                <div>
                  <div className="text-[10px] uppercase font-bold text-outline">Tiền nước</div>
                  <div className="text-sm font-semibold text-on-surface">
                    {listing.waterPrice ? listing.waterPrice : 'Trao đổi khi liên hệ'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 font-bold bg-amber-50 p-1.5 rounded-full">receipt_long</span>
                <div>
                  <div className="text-[10px] uppercase font-bold text-outline">Chi phí khác</div>
                  <div className="text-sm font-semibold text-on-surface">{listing.otherCosts || 'Không có'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Static Map View Removed */}


        </div>

        {/* Right column (Booking cost calculator & checkout sticky card) */}
        <div className="space-y-6">
          <div className="sticky top-[110px] space-y-6">
            
            {/* Main Estimator card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 space-y-6">
              
              <div className="space-y-1">
                <span className="text-[10px] text-outline font-medium">Báo giá thuê cơ bản</span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl font-black text-primary">
                    {formatVND(listing.price)}
                  </span>
                  {listing.priceUSD && (
                    <span className="text-xs text-on-surface-variant font-medium">
                       / tháng
                    </span>
                  )}
                </div>
              </div>

              {/* CONTACT SECTION PANEL */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1 text-xs font-black text-on-surface uppercase tracking-wide">
                  <span className="material-symbols-outlined text-indigo-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  <span>Liên hệ chủ trọ</span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-outline font-semibold">Số điện thoại</span>
                    <p className="text-sm font-black text-on-surface tracking-wider">
                      {listing.host.phone || '0901234567'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyPhone}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCopied 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-white text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isCopied ? 'check' : 'content_copy'}
                    </span>
                    {isCopied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* MAP SECTION PANEL */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-1 text-xs font-black text-on-surface uppercase tracking-wide">
                  <span className="material-symbols-outlined text-indigo-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  <span>Vị trí trên bản đồ</span>
                </div>

                <div 
                  className="w-full h-64 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner z-0 group cursor-pointer"
                  onClick={() => setIsMapPopupOpen(true)}
                >
                  {/* Overlay for clicking */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors z-[10] flex items-center justify-center">
                    <span className="bg-white/95 hover:bg-white text-primary text-xs font-bold px-3 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                      <span className="material-symbols-outlined text-[16px] font-bold">fullscreen</span>
                      Phóng to bản đồ
                    </span>
                  </div>
                  <div className="w-full h-full pointer-events-none">
                    <MapContainer 
                      center={listing.lat && listing.lng ? [listing.lat, listing.lng] : [16.07380, 108.14990]} 
                      zoom={15} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker 
                        position={[16.07380, 108.14990]} 
                        icon={L.divIcon({
                          html: `
                            <div class="flex flex-col items-center">
                              <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                                <span class="material-symbols-outlined text-white" style="font-size: 16px;">school</span>
                              </div>
                              <div class="bg-red-600 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow-sm border border-white whitespace-nowrap mt-0.5">
                                ĐH BÁCH KHOA
                              </div>
                            </div>
                          `,
                          className: 'school-div-icon',
                          iconSize: [70, 40],
                          iconAnchor: [35, 20]
                        })}
                      >
                        <Popup>ĐH Bách Khoa Đà Nẵng</Popup>
                      </Marker>
                      {listing.lat && listing.lng ? (
                        <Marker 
                          position={[listing.lat, listing.lng]} 
                          icon={L.divIcon({
                            className: 'bg-transparent border-none',
                            html: `
                              <div class="relative flex justify-center items-center w-8 h-8">
                                <span class="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                                <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-sm"></span>
                              </div>
                            `,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16],
                            popupAnchor: [0, -16]
                          })}
                        >
                          <Popup><strong className="text-red-600">Vị trí phòng trọ</strong></Popup>
                        </Marker>
                      ) : (
                        <Marker position={[16.07348, 108.14783]}>
                          <Popup>Vị trí phòng trọ (Mặc định)</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center space-y-1">
                  <span className="text-[14px] text-primary uppercase font-extrabold tracking-widest">Khoảng cách đến DUT</span>
                  <p className="text-[27px] font-black text-primary">
                    {listing.distanceDUT < 1 
                      ? `${Math.round(listing.distanceDUT * 1000)}m` 
                      : `${Number(listing.distanceDUT).toFixed(1)} km`}
                  </p>
                  <p className="text-[10px] text-outline font-semibold">
                    {listing.distanceText}
                  </p>
                </div>
              </div>

              {/* CTA Action button lines */}
              <div className="space-y-2">
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Popup Modal */}
      {isMapPopupOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fade-in cursor-default"
          onClick={() => setIsMapPopupOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white z-[10]">
              <div className="space-y-0.5">
                <h3 className="text-base md:text-lg font-black text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-xl">map</span>
                  Vị trí trên bản đồ chi tiết
                </h3>
                <p className="text-xs md:text-sm text-outline font-medium line-clamp-1">{listing.address}</p>
              </div>
              <button 
                onClick={() => setIsMapPopupOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Map Container */}
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer 
                center={listing.lat && listing.lng ? [listing.lat, listing.lng] : [16.07380, 108.14990]} 
                zoom={16} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker 
                  position={[16.07380, 108.14990]} 
                  icon={L.divIcon({
                    html: `
                      <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                          <span class="material-symbols-outlined text-white" style="font-size: 16px;">school</span>
                        </div>
                        <div class="bg-red-600 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow-sm border border-white whitespace-nowrap mt-0.5">
                          ĐH BÁCH KHOA
                        </div>
                      </div>
                    `,
                    className: 'school-div-icon',
                    iconSize: [70, 40],
                    iconAnchor: [35, 20]
                  })}
                >
                  <Popup>ĐH Bách Khoa Đà Nẵng</Popup>
                </Marker>
                {listing.lat && listing.lng ? (
                  <Marker 
                    position={[listing.lat, listing.lng]} 
                    icon={L.divIcon({
                      className: 'bg-transparent border-none',
                      html: `
                        <div class="relative flex justify-center items-center w-8 h-8">
                          <span class="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                          <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-sm"></span>
                        </div>
                      `,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                      popupAnchor: [0, -16]
                    })}
                  >
                    <Popup><strong className="text-red-600">Vị trí phòng trọ</strong></Popup>
                  </Marker>
                ) : (
                  <Marker position={[16.07348, 108.14783]}>
                    <Popup>Vị trí phòng trọ (Mặc định)</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
