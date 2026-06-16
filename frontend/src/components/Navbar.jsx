import React from 'react';

export default function Navbar({
  currentView,
  onViewChange,
  savedCount,
  isLoggedIn,
  userEmail,
  userName,
  onClearAll,
  onResetData
}) {
  const userDisplayName = isLoggedIn ? (userName || userEmail.split('@')[0]) : '';

  return (
    <>
      {/* Main Top Header Navigation */}
      <header className="sticky top-0 w-full z-[80] bg-white/75 backdrop-blur-xl border-b border-slate-200/60 shadow-xs transition-all">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          {/* Logo Brand */}
          <div 
            onClick={() => onViewChange('HOME')}
            className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-primary text-3xl font-extrabold select-none transition-transform group-hover:scale-110">map</span>
            <div className="text-xl md:text-2xl font-black tracking-tight text-primary">
              BK'S MAP
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onViewChange('HOME')}
              className={`font-semibold text-sm transition-colors cursor-pointer hover:text-primary ${
                currentView === 'HOME' ? 'text-primary' : 'text-slate-600'
              }`}
            >
              Khám phá
            </button>
            <button
              onClick={() => onViewChange('MAP')}
              className={`font-semibold text-sm transition-colors cursor-pointer hover:text-primary flex items-center gap-1 ${
                currentView === 'MAP' ? 'text-primary' : 'text-slate-600'
              }`}
            >
              Bản đồ & Bộ lọc
            </button>
            <button
              onClick={() => onViewChange('DASHBOARD')}
              className={`font-semibold text-sm transition-colors cursor-pointer hover:text-primary ${
                currentView === 'DASHBOARD' ? 'text-primary' : 'text-slate-600'
              }`}
            >
              Dành cho Chủ trọ
            </button>
          </nav>

          {/* Actions on Right */}
          <div className="flex items-center gap-4">
            {/* Wishlist Indicators */}
            <div 
              onClick={() => onViewChange('USER')}
              className="relative cursor-pointer hover:text-primary text-slate-500 transition-colors flex items-center"
              title="Nhà trọ đã lưu"
            >
              <span className="material-symbols-outlined">favorite</span>
              {savedCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold border border-white">
                  {savedCount}
                </span>
              )}
            </div>

            {/* User Login Section */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3.5 border-l pl-4 border-slate-200">
                <div 
                  onClick={() => onViewChange('USER')}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                  title="Xem trang cá nhân sổ tay của bạn"
                >
                  <div className="w-8.5 h-8.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm border border-indigo-200">
                    {userDisplayName[0]}
                  </div>
                  <span className="hidden lg:inline text-xs font-bold text-slate-700 max-w-28 truncate">{userDisplayName}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onViewChange('LOGIN')}
                className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm shadow-primary/10"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Nav for Mobile Viewports (Visible only on small devices) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lg h-16 px-4 flex justify-around items-center">
        <button
          onClick={() => onViewChange('HOME')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentView === 'HOME' ? 'text-primary scale-105 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">explore</span>
          <span className="text-[10px] font-semibold mt-0.5">Khám phá</span>
        </button>
        <button
          onClick={() => onViewChange('MAP')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentView === 'MAP' ? 'text-primary scale-105 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">location_on</span>
          <span className="text-[10px] font-semibold mt-0.5">Bản đồ</span>
        </button>
        <button
          onClick={() => onViewChange('DASHBOARD')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentView === 'DASHBOARD' ? 'text-primary scale-105 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">dashboard</span>
          <span className="text-[10px] font-semibold mt-0.5">Chủ trọ</span>
        </button>
        <button
          onClick={() => onViewChange(isLoggedIn ? 'USER' : 'LOGIN')}
          className={`flex flex-col items-center justify-center transition-all ${
            currentView === 'USER' || currentView === 'LOGIN' ? 'text-primary scale-105 font-bold' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="text-[10px] font-semibold mt-0.5">{isLoggedIn ? 'Cá nhân' : 'Đăng nhập'}</span>
        </button>
      </div>
    </>
  );
}
