import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { savedIds, favoriteRooms, toggleSaved, loadSavedIds } = useUiStore();

  const userDisplayName = userName || userEmail.split('@')[0];
  const savedListings = isLoggedIn
    ? favoriteRooms
    : listings.filter(l => savedIds.includes(l.id));

  const [sortBy, setSortBy] = React.useState('newest');

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
  
  
  const sortedListings = [...savedListings].sort((a, b) => {
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
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-bold cursor-pointer">
            <Heart size={18} fill="currentColor" />
            <span className="text-sm">Nhà trọ yêu thích</span>
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
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onClick={() => setIsModalOpen(true)}>
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
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-10 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="bg-red-100 text-red-500 w-12 h-12 flex items-center justify-center rounded-2xl">
                  <Heart size={24} fill="currentColor" />
                </span>
                Nhà trọ yêu thích của tôi
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-2">Danh sách những phòng trọ bạn đã "tym" để xem lại sau.</p>
            </div>
            {savedListings.length > 0 && (
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

          {savedListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center space-y-4 shadow-sm">
              <span className="material-symbols-outlined text-6xl text-slate-200">favorite</span>
              <h3 className="text-lg font-bold text-slate-700">Chưa có nhà trọ yêu thích nào</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Khi bạn lướt xem phòng trọ, hãy bấm vào biểu tượng trái tim để lưu lại những căn ưng ý nhất nhé.
              </p>
              <button 
                onClick={() => navigate('/map')}
                className="mt-4 bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Khám phá ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedListings.map(listing => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group flex flex-col relative"
                  onClick={() => onSelectListing(listing.id)}
                >
                  {/* Cover Photo */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                    <img 
                      src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={listing.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Badges on Top */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
                      {listing.verified && (
                        <span className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          XÁC THỰC
                        </span>
                      )}
                      {listing.tag && !listing.verified && (
                        <span className="bg-secondary text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                          {listing.tag}
                        </span>
                      )}
                    </div>

                    {/* Unfavorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaved(listing.id);
                      }}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-sm text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 z-10 cursor-pointer flex items-center justify-center border-none"
                    >
                      <Heart size={18} fill="currentColor" />
                    </button>

                    {/* Bottom gradient overlay with time ago and image count */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/75 to-transparent flex items-end justify-between px-3 pb-2.5 pointer-events-none select-none">
                      <span className="text-white text-[12px] font-bold drop-shadow-md">
                        {getTimeAgo(listing.updatedAt || listing.createdAt || new Date().toISOString())}
                      </span>
                      {listing.images && listing.images.length > 0 && (
                        <div className="flex items-center gap-1 text-white text-[12px] font-bold drop-shadow-md">
                          <span>{listing.images.length}</span>
                          <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Metadata */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                          {listing.title}
                        </h4>
                        
                        <p className="text-[17px] font-black text-primary leading-none pt-0.5 pb-1 flex items-baseline">
                          {formatVND(listing.price)}
                          <span className="text-[10px] font-bold text-on-surface-variant ml-0.5">/tháng</span>
                        </p>
                        
                        <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-primary shrink-0">location_on</span>
                          <span className="line-clamp-2">{formatAddressShort(listing.address)}</span>
                        </p>
                        
                        {listing.distanceText && (
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 whitespace-nowrap mt-1">
                            <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                            {listing.distanceText}
                          </p>
                        )}
                      </div>

                      {/* Host avatar */}
                      {listing.host?.avatar ? (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0 bg-slate-100">
                          <img
                            alt={listing.host.name || 'Chủ trọ'}
                            className="w-full h-full object-cover"
                            src={listing.host.avatar}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                          {listing.host?.name ? listing.host.name[0] : 'C'}
                        </div>
                      )}
                    </div>

                    {/* Amenity tags */}
                    <div className="flex flex-nowrap gap-1.5 pt-2 border-t border-outline-variant/15 overflow-hidden">
                      {listing.amenities?.slice(0, 1).map((amenity, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-on-surface-variant px-2.5 py-1 rounded-md font-semibold font-sans whitespace-nowrap truncate max-w-[150px]">
                          {amenity}
                        </span>
                      ))}
                      {listing.amenities?.length > 1 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold font-sans whitespace-nowrap shrink-0">
                          +{listing.amenities.length - 1} khác
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
