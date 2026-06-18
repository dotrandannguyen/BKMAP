import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  ChevronDown,
  Settings,
  Trash2,
  Heart
} from 'lucide-react';

const UserPage = ({ userEmail = 'dannguyen@dut.udn.vn', userName, listings = [], savedIds = [], onSelectListing, onLogout }) => {
  const navigate = useNavigate();
  const userDisplayName = userName || userEmail.split('@')[0];

  const savedListings = listings.filter(l => savedIds.includes(l.id));

  const formatVND = (num) => {
    return num.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] font-sans antialiased bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full hidden md:flex">
        {/* User section */}
        <div className="px-5 py-4 flex items-center gap-3 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-sm shadow-primary/20">
            {userDisplayName[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="block font-bold text-slate-800 truncate text-sm">{userDisplayName}</span>
            <span className="block text-[10px] text-slate-500 truncate">{userEmail}</span>
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
        <div className="mt-auto p-3 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors">
            <Settings size={18} />
            <span className="text-sm font-semibold">Cài đặt cá nhân</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => onLogout && onLogout()}>
            <Trash2 size={18} />
            <span className="text-sm font-semibold">Đăng xuất tài khoản</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-10 max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="bg-red-100 text-red-500 w-12 h-12 flex items-center justify-center rounded-2xl">
                <Heart size={24} fill="currentColor" />
              </span>
              Nhà trọ yêu thích của tôi
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2">Danh sách những phòng trọ bạn đã "tym" để xem lại sau.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedListings.map(listing => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group flex flex-col"
                  onClick={() => onSelectListing(listing.id)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img 
                      src={listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={listing.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-500">
                      <Heart size={18} fill="currentColor" />
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-lg text-slate-800 shadow-sm">
                        {listing.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="line-clamp-1">{listing.address}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className="font-black text-primary">
                        {formatVND(listing.price)}<span className="text-[10px] text-slate-500 font-semibold uppercase">/tháng</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserPage;
