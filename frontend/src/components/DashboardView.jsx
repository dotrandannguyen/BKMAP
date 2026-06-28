import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useListingStore } from '../stores/listingStore';
import { useAuthStore } from '../stores/authStore';

// Badge hiển thị trạng thái phê duyệt (approvalStatus từ backend)
const ApprovalBadge = ({ approvalStatus }) => {
  const map = {
    APPROVED:         { text: 'Đang hiển thị',   className: 'bg-green-100 text-green-800' },
    PENDING_APPROVAL: { text: 'Chờ Admin duyệt', className: 'bg-amber-100 text-amber-800 animate-pulse' },
    REJECTED:         { text: 'Bị từ chối',       className: 'bg-red-100 text-red-700' },
    ADMIN_HIDDEN:     { text: 'Bị Admin ẩn',     className: 'bg-rose-100 text-rose-800' },
  };
  const { text, className } = map[approvalStatus] || { text: 'Không rõ', className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap ${className}`}>
      {text}
    </span>
  );
};

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api') {
    return import.meta.env.VITE_API_URL;
  }
  return `http://${window.location.hostname}:3000/api`;
};

export default function DashboardView() {
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.userEmail);
  const { deleteListing, selectListing, setEditingListing } = useListingStore();

  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch danh sách phòng của chính mình (kể cả PENDING, REJECTED)
  const fetchMyListings = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMyListings([]);
      setLoadingListings(false);
      return;
    }
    setLoadingListings(true);
    try {
      const res = await fetch(`${getApiUrl()}/rooms?mine=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const raw = json.data?.data || json.data || [];
        setMyListings(raw);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching my listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [userEmail]);

  const onSelectListing = (id) => {
    selectListing(id);
    navigate(`/rooms/${id}`);
  };

  const onEditListing = (room) => {
    if (room.approvalStatus === 'PENDING_APPROVAL') {
      toast.warning('⏳ Bài đăng này đang chờ Admin duyệt. Vui lòng đợi kết quả trước khi chỉnh sửa tiếp.');
      return;
    }
    if (room.approvalStatus === 'REJECTED') {
      toast.error('❌ Bài đăng này đã bị từ chối và không thể chỉnh sửa nữa.');
      return;
    }
    // Map raw room data sang format của editingListing store
    const listingForEdit = {
      id: room.id,
      title: room.title,
      type: room.type || 'Trọ',
      price: room.price,
      area: room.area,
      address: room.address,
      description: room.description || '',
      amenities: room.features?.map(f => f.feature?.name || '').filter(Boolean) || [],
      images: room.images?.map(img => img.imageUrl) || [],
      host: {
        name: room.owner?.userName || '',
        phone: room.owner?.phoneNumber || '',
      },
      electricityPrice: room.electricityPrice || '',
      waterPrice: room.waterPrice || '',
      otherCosts: room.otherCosts || '',
      lat: Number(room.latitude),
      lng: Number(room.longitude),
      distanceDUT: room.distanceToBk,
      ownerEmail: room.creator?.email || userEmail,
      approvalStatus: room.approvalStatus,
    };
    setEditingListing(listingForEdit);
    navigate('/create');
  };

  const onDeleteListing = async (id) => {
    try {
      await deleteListing(id);
      setMyListings(prev => prev.filter(r => r.id !== id));
      toast.success('Đã xóa phòng trọ thành công.');
    } catch (error) {
      toast.error('Không thể xóa phòng: ' + error.message);
    }
  };

  const onCreateNew = () => {
    setEditingListing(null);
    navigate('/create');
  };

  const formatVND = (num) => Number(num).toLocaleString('vi-VN') + ' VNĐ';

  const formatAddressShort = (addr) => {
    if (!addr) return '';
    return addr.replace(/,?\s*(Thành phố Đà Nẵng|Đà Nẵng|TP Đà Nẵng|TP\. Đà Nẵng)/gi, '').trim();
  };

  const pendingCount = myListings.filter(r => r.approvalStatus === 'PENDING_APPROVAL').length;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 animate-fade-in pb-28 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest bg-primary/10 px-3 py-1 rounded-full">Kênh người đăng tin</span>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight mt-1.5">
            Bảng Quản lý & Hoạt động
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium">Theo dõi hoạt động và tình trạng phòng thực tế.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/15 active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">add_box</span>
          <span>ĐĂNG TIN NHÀ MỚI</span>
        </button>
      </div>

      {/* Banner cảnh báo nếu có phòng đang chờ duyệt */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              Bạn có {pendingCount} bài đăng đang chờ Admin xét duyệt.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Trong thời gian chờ, các bài này sẽ <strong>tạm ẩn</strong> khỏi danh sách công khai. Bạn không thể chỉnh sửa thêm cho đến khi Admin phê duyệt hoặc từ chối.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[2.25rem] border border-slate-200/60 overflow-hidden shadow-xs">
        {!userEmail ? (
          <div className="py-20 px-6 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-slate-300">lock</span>
            <h3 className="text-base font-bold text-on-surface-variant">Vui lòng đăng nhập để quản lý tin đăng</h3>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              Bạn cần đăng nhập tài khoản để có thể xem danh sách, chỉnh sửa hoặc đăng tin phòng trọ mới của mình.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-primary/10"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : loadingListings ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
            <p className="text-sm text-on-surface-variant mt-3">Đang tải danh sách phòng...</p>
          </div>
        ) : myListings.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-slate-300">work_outline</span>
            <h3 className="text-base font-bold text-on-surface-variant">Chưa có phòng trọ nào do bạn quản lý</h3>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              Bắt đầu bằng cách nhấp vào "Đăng tin nhà mới".
            </p>
            <button
              onClick={onCreateNew}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Đăng trọ mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] md:text-xs font-bold text-outline uppercase tracking-wider">
                  <th className="px-6 py-4">Chỗ ở trọ</th>
                  <th className="px-6 py-4">Mức giá thuê</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                {myListings.map((room) => {
                  const isPending = room.approvalStatus === 'PENDING_APPROVAL';
                  const thumbnail = room.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267';
                  return (
                    <tr key={room.id} className={`hover:bg-slate-50/50 transition-colors ${isPending ? 'opacity-75' : ''}`}>
                      {/* Title col */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200">
                            <img
                              loading="lazy"
                              alt={room.title}
                              className="w-full h-full object-cover"
                              src={thumbnail}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <span
                              onClick={() => !isPending && onSelectListing(room.id)}
                              className={`font-bold text-on-surface line-clamp-1 block leading-tight text-xs sm:text-sm ${isPending ? 'cursor-default' : 'hover:text-primary cursor-pointer'}`}
                            >
                              {room.title}
                            </span>
                            <span className="text-[10px] text-outline font-semibold uppercase mt-0.5 block">
                              {formatAddressShort(room.address)}
                            </span>
                            {room.rejectionReason && room.approvalStatus === 'REJECTED' && (
                              <span className="text-[10px] text-red-500 mt-0.5 block">
                                Lý do: {room.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price col */}
                      <td className="px-6 py-4 font-black text-primary text-xs sm:text-sm whitespace-nowrap">
                        {formatVND(room.price)}
                        <span className="text-[10px] font-medium text-outline">/tháng</span>
                      </td>

                      {/* Approval Status col */}
                      <td className="px-6 py-4">
                        <ApprovalBadge approvalStatus={room.approvalStatus} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => onSelectListing(room.id)}
                            disabled={isPending}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isPending ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-primary/10 text-on-surface-variant hover:text-primary cursor-pointer'}`}
                            title={isPending ? 'Đang chờ duyệt' : 'Xem chi tiết'}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => onEditListing(room)}
                            disabled={isPending || room.approvalStatus === 'REJECTED'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors font-bold ${
                              isPending || room.approvalStatus === 'REJECTED'
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer'
                            }`}
                            title={
                              isPending
                                ? 'Đang chờ duyệt, không thể sửa'
                                : room.approvalStatus === 'REJECTED'
                                ? 'Bài đăng đã bị từ chối, không thể sửa'
                                : 'Sửa tin này'
                            }
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          {!isPending && room.approvalStatus === 'ADMIN_HIDDEN' && (
                            <button
                              disabled
                              className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 cursor-not-allowed flex items-center justify-center font-bold"
                              title="Bị Admin khóa ẩn, không thể tự mở"
                            >
                              <span className="material-symbols-outlined text-sm">block</span>
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(room)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex items-center justify-center cursor-pointer font-bold"
                            title="Xóa tin này"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600" style={{ fontSize: '28px' }}>warning</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận xóa</h3>
            <p className="text-sm text-gray-500 mb-5">
              Bạn chắc chắn muốn xóa niêm yết <strong className="text-gray-700">"{deleteTarget.title}"</strong>?<br/>Thao tác không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => { onDeleteListing(deleteTarget.id); setDeleteTarget(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
