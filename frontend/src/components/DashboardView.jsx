import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useListingStore } from '../stores/listingStore';
import { useAuthStore } from '../stores/authStore';

export default function DashboardView() {
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.userEmail);
  const { listings: allListings, deleteListing, toggleStatus, selectListing, setEditingListing, resetData, clearAll, fetchRooms, isLoading } = useListingStore();

  useEffect(() => {
    if (userEmail) {
      fetchRooms({ ownerEmail: userEmail, limit: 100 });
    }
  }, [userEmail, fetchRooms]);

  const listings = allListings.filter((item) => item.ownerEmail === userEmail || item.ownerEmail === 'guest@example.com');

  const onSelectListing = (id) => {
    selectListing(id);
    navigate(`/rooms/${id}`);
  };
  const onEditListing = (id) => {
    const listingToEdit = allListings.find(l => l.id === id);
    if (listingToEdit) {
      setEditingListing(listingToEdit);
      navigate('/create');
    }
  };
  const onDeleteListing = async (id) => {
    try {
      await deleteListing(id);
    } catch (error) {
      toast.error('Không thể xóa phòng: ' + error.message);
    }
  };
  const onCreateNew = () => {
    setEditingListing(null);
    navigate('/create');
  };
  const [activeCategory, setActiveCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Filter listings based on active dashboard category
  const filtered = listings.filter((item) => {
    if (activeCategory === 'verified') return item.verified === true;
    if (activeCategory === 'pending') return item.verified === false;
    if (activeCategory === 'maintenance') return item.status === 'Bảo trì';
    return true; // 'all'
  });

  const totalCount = listings.length;


  const formatVND = (num) => {
    return num.toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatAddressShort = (addr) => {
    if (!addr) return '';
    return addr.replace(/,?\s*(Thành phố Đà Nẵng|Đà Nẵng|TP Đà Nẵng|TP\. Đà Nẵng)/gi, '').trim();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 animate-fade-in pb-28 space-y-10">
      
      {/* 1. Header with Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest bg-primary/10 px-3 py-1 rounded-full">Kênh người đăng tin</span>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight mt-1.5">
            Bảng Quản lý & Hoạt động
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium">Theo dõi hoạt động và tình trạng phòng thực tế.</p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={() => onCreateNew()}
            className="bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/15 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add_box</span>
            <span>ĐĂNG TIN NHÀ MỚI</span>
          </button>
        </div>
      </div>


      {/* 3. Main content grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Right column (Table list for modifying items) */}
        <div className="space-y-4">
          
          {/* Main categories navigation switcher */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 max-w-max">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả ({totalCount})
            </button>
          </div>

          {/* Table container card */}
          <div className="bg-white rounded-[2.25rem] border border-slate-200/60 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 animate-pulse border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-200" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-20" />
                    <div className="flex gap-2 ml-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                      <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : totalCount === 0 ? (
              /* Global Empty State for Dashboard */
              <div className="py-20 px-6 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-slate-300">work_outline</span>
                <h3 className="text-base font-bold text-on-surface-variant">Chưa có phòng trọ nào do bạn quản lý</h3>
                <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
                  Bạn có thể bắt đầu bằng cách nhấp vào "Đăng tin nhà mới".
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => onCreateNew()}
                    className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Đăng trọ mới
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              /* Filtered empty state */
              <div className="py-20 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                <p className="text-sm font-bold text-on-surface-variant">Không tìm thấy phòng ở mục này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] md:text-xs font-bold text-outline uppercase tracking-wider">
                      <th className="px-6 py-4">Chỗ ở trọ</th>
                      <th className="px-6 py-4">Mức giá thuê</th>
                      <th className="px-6 py-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Title col */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200">
                              <img
                                alt={item.title}
                                className="w-full h-full object-cover"
                                src={item.images[0]}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <span 
                                onClick={() => onSelectListing(item.id)}
                                className="font-bold text-on-surface hover:text-primary cursor-pointer line-clamp-1 block leading-tight text-xs sm:text-sm"
                              >
                                {item.title}
                              </span>
                              <span className="text-[10px] text-outline font-semibold uppercase mt-0.5 block">{item.type} • {item.distanceText || formatAddressShort(item.address)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Price col */}
                        <td className="px-6 py-4 font-black text-primary text-xs sm:text-sm whitespace-nowrap">
                          {formatVND(item.price)}
                          <span className="text-[10px] font-medium text-outline">/tháng</span>
                        </td>




                        {/* Actions buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View detail button icon */}
                            <button
                              onClick={() => onSelectListing(item.id)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                            </button>
                            {/* Edit button */}
                            <button
                              onClick={() => onEditListing(item.id)}
                              className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors flex items-center justify-center cursor-pointer font-bold"
                              title="Sửa tin này"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            {/* Live Delete Button code */}
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex items-center justify-center cursor-pointer font-bold"
                              title="Xóa tin này"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div
  className="fixed top-0 left-0 w-screen h-screen z-[99999]
             flex items-center justify-center
             bg-black/50 backdrop-blur-sm"
>
  <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          
            {/* Warning Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600" style={{ fontSize: '28px' }}>warning</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận xóa</h3>
            <p className="text-sm text-gray-500 mb-5">
              Bạn chắc chắn muốn xóa niêm yết <strong className="text-gray-700">"{deleteTarget.title}"</strong>?<br/>Thao tác không hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteListing(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalPopIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </div>
  );
}
