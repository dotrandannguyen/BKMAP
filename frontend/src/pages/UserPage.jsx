import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';
import {
  Search,
  Home,
  ChevronDown,
  Settings,
  Trash2,
  Heart,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

const UserPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail = 'dannguyen@dut.udn.vn', userName, logout, userAvatar, changePassword: changePasswordAction } = useAuthStore();
  const { listings, selectListing } = useListingStore();
  const { savedIds, favoriteRooms, toggleSaved, loadSavedIds, viewedIds = [], clearViewedRooms } = useUiStore();

  const userDisplayName = userName || userEmail.split('@')[0];
  const savedListings = isLoggedIn
    ? favoriteRooms
    : listings.filter(l => savedIds.map(String).includes(String(l.id)));

  const historyListings = viewedIds
    .map(id => listings.find(l => String(l.id) === String(id)))
    .filter(Boolean);

  const [activeTab, setActiveTab] = React.useState('menu'); // 'menu' | 'saved' | 'history'
  const [sortBy, setSortBy] = React.useState('newest');

  const currentListings = activeTab === 'history' ? historyListings : savedListings;

  React.useEffect(() => {
    if (isLoggedIn) {
      loadSavedIds();
    }
  }, [isLoggedIn, loadSavedIds]);

  // State for Change Password Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [success, setSuccess] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setSuccess(null);
      setIsLoading(false);
    }
  }, [isModalOpen]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess(null);

    // Frontend validation
    let validationErrors = {};
    if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = 'Mật khẩu mới và xác nhận mật khẩu không khớp.';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const data = await changePasswordAction({ oldPassword, newPassword, confirmPassword });
      setSuccess(data.message || 'Đổi mật khẩu thành công!');
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Close modal after a delay, showing success message
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null); // Clear success message after modal closes
      }, 2000);
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Chức năng này đang được phát triển hoặc có lỗi xảy ra.' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const sortedListings = [...currentListings].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const onSelectListing = (id) => {
    selectListing(id);
    navigate(`/rooms/${id}`);
  };

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

  const formatVND = (num) => {
    if (!num) return '0';
    return Number(num).toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatAddressShort = (addr) => {
    if (!addr) return '';
    return addr.replace(/,?\s*(Thành phố Đà Nẵng|Đà Nẵng|TP Đà Nẵng|TP\. Đà Nẵng)/gi, '').trim();
  };

  return (
    <div className="flex h-[calc(100vh-64px)] font-sans antialiased bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full hidden md:flex">
        {/* User section */}
        <div className="px-5 py-4 flex items-center gap-3 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors" onClick={() => !isLoggedIn ? navigate('/login') : navigate('/')}>
          {isLoggedIn ? (
            userAvatar ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200">
                <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-sm shadow-primary/20">
                {userDisplayName[0]}
              </div>
            )
          ) : (
            <div className="w-9 h-9 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              ?
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <span className="block font-bold text-slate-800 truncate text-sm">{isLoggedIn ? userDisplayName : 'Khách truy cập'}</span>
            <span className="block text-[10px] text-slate-500 truncate">{isLoggedIn ? userEmail : 'Bấm để đăng nhập'}</span>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>

        {/* Main nav items */}
        <div className="px-3 py-4 space-y-1">
          <div 
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold cursor-pointer transition-colors ${activeTab === 'saved' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Heart size={18} fill={activeTab === 'saved' ? "currentColor" : "none"} />
            <span className="text-sm">Nhà trọ yêu thích</span>
          </div>
          <div 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold cursor-pointer transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className={`material-symbols-outlined text-[20px] ${activeTab === 'history' ? 'text-primary' : ''}`}>history</span>
            <span className="text-sm font-semibold">Lịch sử xem tin</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onClick={() => navigate('/map')}>
            <Search size={18} />
            <span className="text-sm font-semibold">Tìm phòng trọ</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onClick={() => navigate('/')}>
            <Home size={18} />
            <span className="text-sm font-semibold">Trang chủ</span>
          </div>
        </div>

        {/* Bottom nav */}
        {isLoggedIn ? (
          <div className="mt-auto p-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onClick={() => {
              const isGoogleLogin = localStorage.getItem('isGoogleLogin') === 'true';
              if (isGoogleLogin) {
                toast.warning('Tài khoản của bạn đăng nhập bằng Google, do đó không thể đổi mật khẩu trên hệ thống này.');
              } else {
                setIsModalOpen(true);
              }
            }}>
              <Lock size={18} />
              <span className="text-sm font-semibold">Đổi mật khẩu</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => { logout(); navigate('/login'); }}>
              <Trash2 size={18} />
              <span className="text-sm font-semibold">Đăng xuất tài khoản</span>
            </div>
          </div>
        ) : (
          <div className="mt-auto p-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => navigate('/login')}>
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span className="text-sm font-semibold">Đăng nhập ngay</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-10">
        <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
          {/* Mobile Profile Card */}
          <div className={`${(activeTab === 'history' || activeTab === 'saved') ? 'hidden' : 'block md:hidden'} bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4`}>
            <div className="flex items-center gap-3.5">
              {isLoggedIn ? (
                userAvatar ? (
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                    <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-lg uppercase shadow-sm shadow-primary/20 flex-shrink-0">
                    {userDisplayName[0]}
                  </div>
                )
              ) : (
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                  ?
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-black text-slate-800 truncate text-base">{isLoggedIn ? userDisplayName : 'Khách truy cập'}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{isLoggedIn ? userEmail : 'Đăng nhập để lưu tin và đăng tin'}</p>
              </div>
            </div>
            
            {!isLoggedIn && (
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer hover:bg-primary-container transition-all active:scale-98 shadow-sm shadow-primary/10"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Đăng nhập ngay</span>
              </button>
            )}
          </div>

          {/* Mobile Utilities Menu */}
          <div className={`md:hidden space-y-3 ${activeTab === 'menu' ? 'block' : 'hidden'}`}>
             <h4 className="text-sm font-bold text-slate-500 ml-1">Tiện ích</h4>
             <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm flex flex-col">
                <div 
                  onClick={() => setActiveTab('saved')}
                  className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer border-b border-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="text-slate-500" size={20} />
                    <span className="font-semibold text-slate-700 text-sm">Tin đã lưu</span>
                  </div>
                  <ChevronDown className="text-slate-400 -rotate-90" size={18} />
                </div>
                
                <div 
                  onClick={() => setActiveTab('history')}
                  className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">history</span>
                    <span className="font-semibold text-slate-700 text-sm">Lịch sử xem tin</span>
                  </div>
                  <ChevronDown className="text-slate-400 -rotate-90" size={18} />
                </div>
             </div>

             {isLoggedIn && (
               <>
                 <h4 className="text-sm font-bold text-slate-500 ml-1 mt-6">Khác</h4>
                 <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm flex flex-col">
                    <div 
                      onClick={() => {
                        const isGoogleLogin = localStorage.getItem('isGoogleLogin') === 'true';
                        if (isGoogleLogin) {
                          toast.warning('Tài khoản của bạn đăng nhập bằng Google, do đó không thể đổi mật khẩu trên hệ thống này.');
                        } else {
                          setIsModalOpen(true);
                        }
                      }}
                      className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 active:bg-slate-100 cursor-pointer border-b border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="text-slate-500" size={20} />
                        <span className="font-semibold text-slate-700 text-sm">Đổi mật khẩu</span>
                      </div>
                      <ChevronDown className="text-slate-400 -rotate-90" size={18} />
                    </div>
                    
                    <div 
                      onClick={() => { logout(); navigate('/login'); }}
                      className="flex items-center justify-between p-4 bg-white hover:bg-red-50 active:bg-red-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">logout</span>
                        <span className="font-semibold text-red-500 text-sm">Đăng xuất</span>
                      </div>
                      <ChevronDown className="text-red-400 -rotate-90" size={18} />
                    </div>
                 </div>
               </>
             )}
          </div>

          {/* Desktop View & Mobile Content */}
          <div className={`space-y-8 ${activeTab !== 'menu' ? 'block' : 'hidden md:block'}`}>
            <button 
              onClick={() => setActiveTab('menu')}
              className="md:hidden flex items-center gap-2 text-slate-500 hover:text-primary transition-colors cursor-pointer -mt-4 mb-2"
            >
              <ChevronDown className="rotate-90" size={20} />
              <span className="font-semibold text-sm">Quay lại</span>
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {activeTab === 'history' ? (
                  <>
                    <span className="bg-blue-100 text-blue-500 w-12 h-12 flex items-center justify-center rounded-2xl">
                      <span className="material-symbols-outlined text-[24px]">history</span>
                    </span>
                    Lịch sử xem tin
                  </>
                ) : (
                  <>
                    <span className="bg-red-100 text-red-500 w-12 h-12 flex items-center justify-center rounded-2xl">
                      <Heart size={24} fill="currentColor" />
                    </span>
                    Nhà trọ yêu thích của tôi
                  </>
                )}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-2">
                {activeTab === 'history' 
                  ? 'Danh sách những phòng trọ bạn đã xem dạo gần đây.'
                  : 'Danh sách những phòng trọ bạn đã "tym" để xem lại sau.'}
              </p>
            </div>
            {currentListings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Sắp xếp:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá thấp đến cao</option>
                  <option value="price-desc">Giá cao đến thấp</option>
                </select>
              </div>
            )}
          </div>

          {currentListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center space-y-4 shadow-sm">
              {activeTab === 'history' ? (
                <span className="material-symbols-outlined text-6xl text-slate-200">history</span>
              ) : (
                <span className="material-symbols-outlined text-6xl text-slate-200">favorite</span>
              )}
              <h3 className="text-lg font-bold text-slate-700">
                {activeTab === 'history' ? 'Chưa có lịch sử xem tin' : 'Chưa có nhà trọ yêu thích nào'}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {activeTab === 'history' 
                  ? 'Bạn chưa xem qua phòng trọ nào gần đây.'
                  : 'Khi bạn lướt xem phòng trọ, hãy bấm vào biểu tượng trái tim để lưu lại những căn ưng ý nhất nhé.'}
              </p>
              <button 
                onClick={() => navigate('/map')}
                className="mt-4 bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Khám phá ngay
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedListings.map(listing => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3 flex gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" 
                  onClick={() => onSelectListing(listing.id)}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                     <img src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     {listing.verified && (
                       <div className="absolute top-1.5 left-1.5 z-10">
                         <span className="bg-white/95 backdrop-blur-sm text-primary text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                           <span className="material-symbols-outlined text-[10px] sm:text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                           <span className="hidden sm:inline">XÁC THỰC</span>
                         </span>
                       </div>
                     )}
                     <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end px-2 pb-1">
                        <span className="text-white text-[9px] font-bold">{getTimeAgo(listing.updatedAt || listing.createdAt || new Date().toISOString())}</span>
                     </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-on-surface line-clamp-2 leading-tight">{listing.title}</h4>
                      <p className="text-[11px] sm:text-xs text-on-surface-variant font-medium line-clamp-1 mt-1 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-primary shrink-0">location_on</span>
                        {formatAddressShort(listing.address)}
                      </p>
                      {listing.distanceText && (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-[12px] sm:text-[13px]">directions_walk</span>
                          {listing.distanceText}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-sm sm:text-base font-black text-primary">{formatVND(listing.price)}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant">/tháng</span>
                        </div>
                        {/* Amenities */}
                        {listing.amenities && listing.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {listing.amenities.slice(0, 2).map((amenity, idx) => (
                              <span key={idx} className="text-[8px] sm:text-[10px] bg-slate-100 text-on-surface-variant px-1.5 py-0.5 rounded-md font-semibold truncate max-w-[80px]">
                                {amenity}
                              </span>
                            ))}
                            {listing.amenities.length > 2 && (
                              <span className="text-[8px] sm:text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">
                                +{listing.amenities.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSaved(listing.id); }}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all border-none"
                      >
                        <Heart size={16} fill={savedIds.map(String).includes(String(listing.id)) ? "currentColor" : "none"} className={savedIds.map(String).includes(String(listing.id)) ? "text-red-500" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center font-sans antialiased">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">Đổi mật khẩu</h2>
            <p className="text-slate-500 text-sm mb-6">Để bảo mật, vui lòng không chia sẻ mật khẩu cho người khác.</p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="oldPassword">Mật khẩu cũ</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`mt-1 w-full px-4 py-2.5 bg-slate-100 rounded-lg border ${errors.oldPassword ? 'border-red-500' : 'border-transparent'} focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.oldPassword && <p className="text-xs text-red-600 mt-1">{errors.oldPassword}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="newPassword">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`mt-1 w-full px-4 py-2.5 bg-slate-100 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-transparent'} focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`mt-1 w-full px-4 py-2.5 bg-slate-100 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-transparent'} focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>

              {errors.general && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.general}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
