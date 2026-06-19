import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListingStore } from '../stores/listingStore';
import { useUiStore } from '../stores/uiStore';

export default function HomepageView() {
  const navigate = useNavigate();
  const { listings, selectListing, resetData } = useListingStore();
  const { setSearchQuery, setPriceFilter, savedIds, toggleSaved } = useUiStore();

  const onSelectListing = (id) => {
    selectListing(id);
    navigate(`/rooms/${id}`);
  };
  const [localSearch, setLocalSearch] = useState('');
  const [localPrice, setLocalPrice] = useState('Giá thuê: Mọi mức giá');
  const [emailSub, setEmailSub] = useState('');
  const [subStatus, setSubStatus] = useState(false);

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

  // Sort listings by newest (createdAt or updatedAt) and take top 10
  const recentListings = [...listings].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  }).slice(0, 10);

  const handleSearchSubmit = () => {
    setSearchQuery(localSearch);
    if (localPrice === 'Dưới 1Tr VNĐ') {
      setPriceFilter('under-1m');
    } else if (localPrice === '1Tr - 2Tr VNĐ') {
      setPriceFilter('1m-2m');
    } else if (localPrice === '2Tr - 3Tr VNĐ') {
      setPriceFilter('2m-3m');
    } else if (localPrice === 'Trên 3Tr VNĐ') {
      setPriceFilter('above-3m');
    } else {
      setPriceFilter('all');
    }
    // Switch to Map & List view
    navigate('/map');
  };

  const handleChipClick = (keyword) => {
    setSearchQuery(keyword);
    navigate('/map');
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubStatus(true);
      setTimeout(() => setSubStatus(false), 4000);
      setEmailSub('');
    }
  };

  // Safe locale string helper for large numbers
  const formatVND = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'Tr';
    }
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section with Map mesh background */}
      <section className="relative min-h-[340px] flex items-center justify-center overflow-hidden px-4 md:px-12 pt-16 pb-0 bg-[#f0f4ff]">
        {/* Styled Aerial View Map Mockup Background as seen in layout 1 */}
        <div className="absolute inset-0 z-0 map-mesh">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-[#f8f9ff]/70 to-[#f8f9ff]"></div>
          <div className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] opacity-25 pointer-events-none">
            <img
              className="w-full h-full object-cover"
              alt="Đại học Bách Khoa Đà Nẵng campus background"
              src="https://scontent.fdad3-8.fna.fbcdn.net/v/t39.30808-6/724092523_1510508897290343_671005537170299150_n.jpg?stp=dst-jpg_tt6&cstp=mx800x212&ctp=s800x212&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFdWoqTjNDw2pwKtFH4vfKBh9de3ocIVDCH117ehwhUMDEIPP75qRr1B4PFovJxGSfe9_VubW6NgQzY0ROZDwLe&_nc_ohc=pETBLkHZ9KMQ7kNvwG5HGpm&_nc_oc=AdrR4VGY6gesE-gW8dezz_93CsfFBH9qoO9qHG0ww4iawv5MrvLc_6iYpVWjAYFnxyQQZXjsmI-yaFjkutCgiQQB&_nc_zt=23&_nc_ht=scontent.fdad3-8.fna&_nc_gid=e7SX0hUKLVp3DQLe55_p5w&_nc_ss=7b2a8&oh=00_Af8Q70dngz7gvqlHhgYsmm93a3PEIekJeod16V-s328AZQ&oe=6A36DC35"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center gap-8 mt-[130px]">
          {/* <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              Hỗ trợ tìm nơi ở <br className="hidden md:block" /> cho{' '}
              <span className="text-primary relative inline-block">
                sinh viên Bách Khoa
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-sky-200 -z-10 rounded-full"></span>
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Nền tảng kết nối sinh viên với các nhà trọ được {' '}
              <span className="font-semibold text-primary">Đội Tư vấn Sinh viên - Trường Đại học Bách khoa</span> thực hiện.
            </p>
          </div> */}

          {/* Glassmorphic Search Bar */}
          <div className="glass-card w-full max-w-3xl p-1.5 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-3 items-center shadow-2xl">
            <div className="flex items-center flex-1 w-full px-4 gap-3 border-b md:border-b-0 md:border-r border-outline-variant/30 py-2.5 md:py-0">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <input
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface text-sm placeholder:text-outline"
                placeholder="Gần DUT, chợ, hoặc Quận..."
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
            </div>
            
            {/* <div className="flex items-center flex-1 w-full px-4 gap-3 py-2.5 md:py-0">
              <span className="material-symbols-outlined text-primary">payments</span>
              <select
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface text-sm appearance-none cursor-pointer"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
              >
                <option>Giá thuê: Mọi mức giá</option>
                <option>Dưới 1Tr VNĐ</option>
                <option>1Tr - 2Tr VNĐ</option>
                <option>2Tr - 3Tr VNĐ</option>
                <option>Trên 3Tr VNĐ</option>
              </select>
            </div> */}

            <button
              onClick={handleSearchSubmit}
              className="w-full md:w-auto bg-primary text-white hover:bg-primary-container px-10 py-2.5 rounded-xl md:rounded-full text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Quick-link Chips */}
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className="text-xs md:text-sm text-on-surface-variant font-medium">Phổ biến:</span>
            <button
              onClick={() => handleChipClick('DUT')}
              className="bg-white hover:bg-primary/5 border border-outline-variant/40 px-4 py-1.5 rounded-full text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              Gần DUT
            </button>
            <button
              onClick={() => handleChipClick('máy lạnh')}
              className="bg-white hover:bg-primary/5 border border-outline-variant/40 px-4 py-1.5 rounded-full text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              Có máy lạnh
            </button>
            <button
              onClick={() => handleChipClick('tự do')}
              className="bg-white hover:bg-primary/5 border border-outline-variant/40 px-4 py-1.5 rounded-full text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              Giờ giấc tự do
            </button>
          </div>
        </div>
      </section>

      {/* 3. Featured Rooms Section */}
      <section 
        className="pt-[10px] pb-[5px] overflow-hidden relative"
        style={{
          backgroundImage: 'url("https://scontent.fdad3-5.fna.fbcdn.net/v/t39.30808-6/474260530_1272157894004468_6359518834788209209_n.jpg?stp=dst-jpg_tt6&cstp=mx1500x1500&ctp=s1500x1500&_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGOf7b8bTlxGxWxukIs9LrnXTbyVspFfwxdNvJWykV_DCHG6kj6jFs1cXl3H30IPR1fffyIu-VAq1-VJprkzOTC&_nc_ohc=ropMnfkKyKUQ7kNvwEbmHXu&_nc_oc=AdrycC-9Z38qmqRILfd4TayJ__8PPddG_jVc7dMPY6chNnoTuqgGPBbx_Ut51KJ8L2pWVzRQjIF7f4tn6dRQ3K1Z&_nc_zt=23&_nc_ht=scontent.fdad3-5.fna&_nc_gid=wu90gpl2lcZDEJGYIiZnpg&_nc_ss=7b2a8&oh=00_Af8oaBhCh8OqKNJ2y0hiH2FjNM96t-SBUPi73zmVJZ8VPQ&oe=6A36D2D8")',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px]"></div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 md:p-10 border border-white/50">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-on-surface">Phòng trọ mới nhất</h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-2">Các phòng trọ vừa được đăng hoặc cập nhật gần đây.</p>
              </div>
              {listings.length > 0 && (
                <button 
                  onClick={() => { setSearchQuery(''); navigate('/map'); }}
                  className="bg-primary/10 text-primary font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-primary hover:text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              )}
            </div>

        {listings.length === 0 ? (
          /* Empty State for Featured Section */
          <div className="max-w-2xl mx-auto px-6 py-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4 animate-fade-in">
            <span className="material-symbols-outlined text-5xl text-slate-300">gite</span>
            <h3 className="text-base font-bold text-slate-700">Chưa có phòng trọ nào trong hệ thống</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Hiện tại danh sách phòng trọ đang trống. Bạn có thể khôi phục dữ liệu mẫu để thử nghiệm tính năng hoặc tiến hành tự đăng tin cho thuê phòng mới.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={resetData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Khôi phục trọ mẫu
              </button>
              <button
                onClick={() => navigate('/create')}
                className="bg-white hover:bg-slate-100 text-slate-700 border px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đăng trọ mới
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable list */
          <div className="flex overflow-x-auto gap-6 pb-6 pt-2 scroll-smooth custom-scrollbar snap-x">
            {recentListings.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectListing(item.id)}
                className="snap-start min-w-[280px] sm:min-w-[340px] md:min-w-[360px] max-w-[400px] bg-white rounded-3xl overflow-hidden hover:scale-[1.01] hover:shadow-xl transition-all duration-300 cursor-pointer shadow-sm flex flex-col group border border-outline-variant/20"
              >
                {/* Cover Photo */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={item.title}
                    src={item.images[0]}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Badges on Top */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
                    <span className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      {formatVND(item.price)}/tháng
                    </span>
                    {item.verified && (
                      <span className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        XÁC THỰC
                      </span>
                    )}
                    {item.tag && !item.verified && (
                      <span className="bg-secondary text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Favorite Toggle button */}
                  <button
                    onClick={(e) => toggleSaved(item.id, e)}
                    className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-colors cursor-pointer"
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
                      <p className="text-xs text-on-surface-variant font-medium flex items-start gap-1">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">location_on</span>
                        <span className="line-clamp-2">{item.address}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.distanceText && (
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                            {item.distanceText}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {getTimeAgo(item.updatedAt || item.createdAt || new Date().toISOString())}
                        </p>
                      </div>
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
                    {item.amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-on-surface-variant px-2.5 py-1 rounded-md font-semibold font-sans">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Special trigger to explore custom details loft directly */}
            {listings.some(x => x.id === 'loft-skyline') && (
              <div
                onClick={() => onSelectListing('loft-skyline')}
                className="snap-start min-w-[280px] sm:min-w-[340px] md:min-w-[360px] bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex flex-col justify-between items-center text-center cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-300"
              >
                <div className="my-auto space-y-2">
                  <span className="material-symbols-outlined text-indigo-600 text-4xl animate-bounce">rocket_launch</span>
                  <h4 className="text-base font-extrabold text-indigo-950">Skyline Student Loft</h4>
                  <p className="text-xs text-indigo-700 max-w-[240px]">
                    Trải nghiệm chỗ ở sinh viên 5 sao cao cấp nhất. Bấm để xem hình ảnh thực tế và đặt phòng trực tiếp!
                  </p>
                </div>
                <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                  Xem Chi Tiết Mẫu
                </span>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <div className="text-center mb-16 space-y-4">
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Vì sao chọn BK'S MAP?</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Định nghĩa lại <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">nhà ở sinh viên</span></h2>
          <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium">
            Xây dựng cho sinh viên, bởi sinh viên, thấu hiểu tường tận mọi vấn đề bạn gặp phải khi tìm nơi an cư trong suốt quãng đời đại học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="relative bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center space-y-6 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-colors duration-500"></div>
            
            <div className="relative w-28 h-28 flex items-center justify-center animate-[bounce_4s_infinite_ease-in-out]">
              <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" alt="Shield 3D" className="w-24 h-24 object-contain drop-shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
            </div>
            
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-extrabold text-slate-800">Đã xác thực 100%</h3>
              <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-medium">
                Mọi phòng trọ đều được đội ngũ sinh viên chúng tôi trực tiếp kiểm tra thực tế để đảm bảo an toàn, sạch sẽ và không lừa đảo.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="relative bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center space-y-6 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl group-hover:bg-orange-400/20 transition-colors duration-500"></div>
            
            <div className="relative w-28 h-28 flex items-center justify-center animate-[bounce_5s_infinite_ease-in-out] bg-gradient-to-br from-orange-400 to-amber-500 rounded-[2rem] shadow-xl shadow-orange-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 border-4 border-white/50 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            </div>
            
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-extrabold text-slate-800">Khám phá bản đồ</h3>
              <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-medium">
                Bản đồ tương tác đột phá giúp sinh viên trực quan tìm đúng phòng sát kề cổng trường, chợ và các khu tiện ích sinh viên.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="relative bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center space-y-6 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl group-hover:bg-pink-400/20 transition-colors duration-500"></div>
            
            <div className="relative w-28 h-28 flex items-center justify-center animate-[bounce_4.5s_infinite_ease-in-out]">
              <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Speech%20Balloon.png" alt="Chat 3D" className="w-24 h-24 object-contain drop-shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
            </div>
            
            <div className="space-y-3 z-10">
              <h3 className="text-xl font-extrabold text-slate-800">Trực tiếp liên hệ</h3>
              <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-medium">
                Liên hệ trực tiếp với chủ trọ thông qua số điện thoại được cung cấp trên nền tảng, nhanh chóng chốt phòng và dọn vào ngay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stats Strip Section in Dark Blue */}
      <section className="py-16 px-6 md:px-12 bg-[#0b1c30] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-extrabold text-sky-300">78,426+</div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-300 uppercase tracking-widest">Lượt truy cập</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-extrabold text-sky-300">{listings.length > 0 ? listings.length : '0'}</div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-300 uppercase tracking-widest">Tổng số trọ hiện có</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-extrabold text-sky-300">4</div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-300 uppercase tracking-widest">Năm hoạt động</p>
          </div>
        </div>
      </section>

      {/* 5. Newsletter Subscription Section */}
      {/* <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="glass-card rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-lg space-y-2 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-extrabold text-on-surface leading-tight">
              Đừng bỏ lỡ ưu đãi tốt
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Nhập email để nhận thông báo khẩn cấp ngay khi có phòng trọ trống mới nhất vừa được phê duyệt xác thực gần cổng trường đại học của bạn.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            <input
              className="px-6 py-3.5 rounded-full bg-white border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm w-full sm:w-72 shadow-inner text-on-surface"
              placeholder="sinhvien@example.com"
              type="email"
              required
              value={emailSub}
              onChange={(e) => setEmailSub(e.target.value)}
            />
            <button
              type="submit"
              className="bg-on-surface text-white px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm hover:bg-on-surface/90 transition-all active:scale-95 shadow-xl flex-shrink-0 text-center cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </form>
        </div>

        {subStatus && (
          <div className="mt-4 p-4 text-center rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-100 text-xs font-semibold animate-bounce max-w-lg mx-auto">
            🎉 Đã đăng ký thành viên thành công! Bạn sẽ nhận thông báo phòng trống sớm nhất.
          </div>
        )}
      </section> */}

      {/* 6. Footer section */}
      <footer className="bg-slate-100/80 pt-16 pb-20 px-6 md:px-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-slate-200">
          <div className="space-y-4">
            <div className="text-xl font-black tracking-tight text-primary">BK'S MAP</div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tạo dựng mạng lưới nhà ở an toàn, chuẩn xác và đáng tin cậy nhất dành riêng cho các thế hệ sinh viên đại học năng động tại thành phố Đà Nẵng bản sắc.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white hover:bg-primary hover:text-white transition-colors flex items-center justify-center text-on-surface-variant border border-slate-200">
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white hover:bg-primary hover:text-white transition-colors flex items-center justify-center text-on-surface-variant border border-slate-200">
                <span className="material-symbols-outlined text-sm">alternate_email</span>
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Nền tảng</h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li><button onClick={() => navigate('/map')} className="hover:text-primary transition-colors cursor-pointer text-left">Tìm phòng trọ</button></li>
              <li><button onClick={() => navigate('/create')} className="hover:text-primary transition-colors cursor-pointer text-left">Đăng tin cho thuê</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors cursor-pointer text-left">Xác thực nhà trọ</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Tài nguyên</h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li><a href="#" className="hover:text-primary transition-colors">Cẩm nang sinh viên</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Mẫu hợp đồng thuê trọ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Mẹo an toàn</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest">Pháp lý</h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách Cookie</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <p>© 2026 BK'S MAP - Bản đồ phòng trọ dành cho sinh viên Bách khoa.</p>
          <p className="flex items-center gap-1">
            Được thực hiện bởi Đội Tư vấn Sinh viên - BKĐN.
          </p>
        </div>
      </footer>

      {/* Floating Fanpage Widget */}
      <a 
        href="https://www.facebook.com/tuvansinhvien.dut" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-lg shadow-indigo-500/30 border border-indigo-100 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all group animate-[bounce_3s_infinite]"
        title="Truy cập Fanpage Tổ Tư Vấn Sinh Viên BKDN"
      >
        <div className="relative w-10 h-10 shrink-0">
          {/* Glowing pulse effect */}
          <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-40 animate-ping"></span>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 bg-indigo-50">
            <img 
            src="https://graph.facebook.com/tuvansinhvien.dut/picture?type=large" 
            alt="TVSV BKDN Logo" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // Fallback icon if Facebook Graph API gets blocked
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-indigo-500 text-xl flex items-center justify-center w-full h-full">support_agent</span>';
            }}
          />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hỗ trợ bởi</span>
          <span className="text-sm font-black text-indigo-700 leading-none group-hover:text-indigo-800"> Đội Tư vấn Sinh viên - BKĐN</span>
        </div>
      </a>
    </div>
  );
}
