import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useListingStore } from '../stores/listingStore';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  Users,
  Home,
  Ban,
  Eye,
  EyeOff,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  Building,
  DollarSign,
  Ruler,
  Info,
  Calendar,
  User as UserIcon,
  Tag,
  MapPin,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api'
    ? import.meta.env.VITE_API_URL
    : `http://${window.location.hostname}:3000/api`;

const confirmAction = (message, onConfirm) => {
  let toastId = null;
  toastId = toast.warn(
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-rose-600" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-800">Xác nhận</h4>
          <p className="text-sm text-slate-600 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => toast.dismiss(toastId)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
        >
          Hủy bỏ
        </button>
        <button
          onClick={() => {
            toast.dismiss(toastId);
            onConfirm();
          }}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-95"
        >
          Đồng ý
        </button>
      </div>
    </div>,
    {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      icon: false,
      theme: "light",
      className: "!rounded-2xl !p-4 !shadow-xl border border-slate-100",
    }
  );
};

const promptAction = (message, onConfirm) => {
  const uniqueInputId = `prompt-${Math.random().toString(36).slice(2, 9)}`;
  let toastId = null;
  toastId = toast.warn(
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Info size={20} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-slate-800">Yêu cầu thông tin</h4>
          <p className="text-sm text-slate-600 mt-1 mb-3">{message}</p>
          <textarea
            id={uniqueInputId}
            placeholder="Nhập nội dung ở đây..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none h-20 transition-all"
            autoFocus
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button
          onClick={() => toast.dismiss(toastId)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
        >
          Hủy bỏ
        </button>
        <button
          onClick={() => {
            const val = document.getElementById(uniqueInputId)?.value;
            toast.dismiss(toastId);
            onConfirm(val);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          Xác nhận
        </button>
      </div>
    </div>,
    {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      icon: false,
      theme: "light",
      className: "!rounded-2xl !p-4 !shadow-xl border border-slate-100",
    }
  );
};

function useAdminFetch() {
  const token = localStorage.getItem('accessToken');
  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API_URL}/admin${path}`, {
        ...options,
        headers: { ...authHeader, ...(options.headers || {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi không xác định');
      return data;
    },
    [token]
  );

  return apiFetch;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient, sub, badge }) {
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-1 -bottom-8 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div>
          <p className="text-3xl font-black text-white tracking-tight">{value ?? <span className="text-white/50">—</span>}</p>
          <p className="text-xs text-white/80 font-semibold mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-white/60 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Approval Bar ─────────────────────────────────────────────────────────────
function ApprovalBar({ approved, pending, rejected, total }) {
  if (!total) return null;
  const pct = (n) => Math.round((n / total) * 100);
  const segments = [
    { value: approved, color: 'bg-emerald-400', label: 'Đã duyệt', pct: pct(approved) },
    { value: pending,  color: 'bg-amber-400',   label: 'Chờ duyệt', pct: pct(pending) },
    { value: rejected, color: 'bg-rose-400',    label: 'Từ chối',   pct: pct(rejected) },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-slate-100">
        {segments.map((s, i) => s.pct > 0 && (
          <div
            key={i}
            className={`${s.color} transition-all duration-700 rounded-full`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-[10px] font-semibold text-slate-500">{s.label}</span>
            <span className="text-[10px] font-black text-slate-700">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ apiFetch, onSwitchTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch('/dashboard')
      .then((r) => setStats(r.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  const totalRooms = stats?.totalRooms || 0;
  const pendingRooms = stats?.pendingRooms || 0;

  return (
    <div className="space-y-5">

      {/* ── Row 1: Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Tổng quan hệ thống</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cập nhật thực tế · {monthName}</p>
        </div>
        {pendingRooms > 0 && (
          <button
            onClick={() => onSwitchTab?.('rooms')}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95"
          >
            <ShieldCheck size={14} />
            Xử lý {pendingRooms} phòng chờ duyệt
          </button>
        )}
      </div>

      {/* ── Row 2: 4 gradient stat cards ──────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tổng người dùng" value={stats?.totalUsers}
          icon={<Users size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          badge={stats?.newUsersThisMonth ? `+${stats.newUsersThisMonth} tháng này` : null} />
        <StatCard label="Tổng phòng trọ" value={stats?.totalRooms}
          icon={<Home size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          badge={stats?.newRoomsThisMonth ? `+${stats.newRoomsThisMonth} tháng này` : null} />
        <StatCard label="Tài khoản bị khóa" value={stats?.bannedUsers}
          icon={<Ban size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-rose-500 to-rose-700"
          sub={stats?.totalUsers ? `${Math.round(((stats?.bannedUsers||0)/stats.totalUsers)*100)}% users` : null} />
        <StatCard label="Phòng bị ẩn" value={stats?.hiddenRooms}
          icon={<EyeOff size={18} className="text-white" />}
          gradient="bg-gradient-to-br from-slate-500 to-slate-700"
          sub="Admin ẩn thủ công" />
      </div>

      {/* ── Row 3: Pending alert ──────────────────── */}
      <div
        onClick={() => onSwitchTab?.('rooms')}
        className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${
          pendingRooms > 0
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300'
            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            pendingRooms > 0 ? 'bg-amber-100' : 'bg-slate-100'
          }`}>
            <ShieldCheck size={24} className={pendingRooms > 0 ? 'text-amber-600' : 'text-slate-400'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-3xl font-black leading-none ${pendingRooms > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {pendingRooms}
              </p>
              {pendingRooms > 0 && (
                <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-lg animate-pulse">
                  Cần xử lý
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">Phòng chờ phê duyệt</p>
          </div>
        </div>
        {pendingRooms > 0 ? (
          <p className="text-xs font-bold text-amber-600 flex items-center gap-1 sm:self-center self-start">
            Nhấn để chuyển sang tab xét duyệt ngay <ChevronRight size={14} />
          </p>
        ) : (
          <p className="text-xs font-bold text-slate-400 flex items-center gap-1 sm:self-center self-start">
            Không có phòng chờ duyệt
          </p>
        )}
      </div>

    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold text-slate-600">
        Trang {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── User Rooms Modal ─────────────────────────────────────────────────────────
function UserRoomsModal({ userId, userName, onClose, apiFetch }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setEditingListing } = useListingStore();
  const navigate = useNavigate();

  const loadRooms = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    apiFetch(`/users/${userId}/rooms`)
      .then((res) => {
        setRooms(res.data || []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [userId, apiFetch]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleEdit = (room) => {
    // Để chỉnh sửa, format images giống cách mà create page mong đợi (dạng string URLs)
    const formattedRoom = {
      ...room,
      images: room.images ? room.images.map(img => img.imageUrl) : []
    };
    setEditingListing(formattedRoom);
    navigate('/create');
  };

  const handleHide = (id, isHidden) => {
    const action = isHidden ? 'restore' : 'hide';
    const label = isHidden ? 'Hiện lại phòng này?' : 'Ẩn phòng này khỏi danh sách?';
    confirmAction(label, async () => {
      try {
        await apiFetch(`/rooms/${id}/${action}`, { method: 'PATCH' });
        toast.success(isHidden ? 'Đã hiện lại phòng trọ.' : 'Đã ẩn phòng trọ.');
        loadRooms();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  const handleDelete = (id, title) => {
    confirmAction(`Xóa vĩnh viễn phòng "${title}"?\n⚠️ Hành động này không thể hoàn tác!`, async () => {
      try {
        await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
        toast.success('Đã xóa phòng trọ vĩnh viễn.');
        loadRooms();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            Phòng trọ của <span className="text-primary">{userName}</span>
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải danh sách phòng...</div>
          ) : rooms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Người dùng này chưa đăng phòng trọ nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex gap-4">
                  {room.images?.[0] ? (
                    <img src={room.images[0].imageUrl} className="w-20 h-20 rounded-lg object-cover" alt="room" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Home size={24} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1 text-sm">{room.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{room.address}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-primary font-bold text-sm">
                        {Number(room.price).toLocaleString('vi-VN')} đ
                      </p>
                      {room.isHidden ? (
                        <span className="px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded font-bold">Bị ẩn</span>
                      ) : room.creator?.isBanned ? (
                        <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-bold">Bị ẩn (Khóa user)</span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleEdit(room)}
                        title="Sửa phòng"
                        className="px-2.5 py-1 text-xs font-bold rounded-lg transition bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleHide(room.id, room.isHidden || room.creator?.isBanned)}
                        title={room.isHidden || room.creator?.isBanned ? 'Hiện lại' : 'Ẩn phòng'}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                          room.isHidden || room.creator?.isBanned
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        {room.isHidden || room.creator?.isBanned ? 'Hiện lại' : 'Ẩn'}
                      </button>
                      <button
                        onClick={() => handleDelete(room.id, room.title)}
                        title="Xóa vĩnh viễn"
                        className="px-2.5 py-1 text-xs font-bold rounded-lg transition bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Room Detail Modal ─────────────────────────────────────────────────────────
function RoomDetailModal({ roomId, onClose, apiFetch }) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    apiFetch(`/rooms/${roomId}`)
      .then((res) => {
        const roomData = res.data;
        setRoom(roomData);
        if (roomData.images?.length > 0) {
          setActiveImage(roomData.images[0].imageUrl);
        }
      })
      .catch((e) => {
        toast.error(e.message);
        onClose();
      })
      .finally(() => setLoading(false));
  }, [roomId, apiFetch, onClose]);

  const InfoRow = ({ icon, label, value, children, className = '' }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="text-slate-400 mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-slate-500 font-semibold">{label}</p>
        {children || <p className="text-sm text-slate-800 font-bold">{value || 'Chưa cập nhật'}</p>}
      </div>
    </div>
  );

  const formatVND = (n) => (n ? Number(n).toLocaleString('vi-VN') + ' đ' : 'Chưa cập nhật');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
            Xem chi tiết phòng trọ
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="py-12 text-center text-slate-400 text-sm">Đang tải thông tin chi tiết...</div>}
          {!loading && !room && <div className="py-12 text-center text-slate-400 text-sm">Không thể tải thông tin phòng.</div>}
          
          {room && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Title & Address */}
                <div>
                   <h1 className="text-2xl font-black text-slate-800">{room.title}</h1>
                   <p className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                     <MapPin size={14} /> {room.address}
                   </p>
                </div>

                 {/* Image Gallery */}
                <div className="space-y-2">
                   {activeImage && (
                     <div className="rounded-xl overflow-hidden shadow-sm relative bg-slate-100 aspect-video w-full border border-slate-200">
                       <img className="w-full h-full object-cover" src={activeImage} alt="Main room view" referrerPolicy="no-referrer" />
                     </div>
                   )}
                   {room.images?.length > 1 && (
                     <div className="flex gap-2 overflow-x-auto pb-1">
                       {room.images.map((img) => (
                         <div
                           key={img.id}
                           onClick={() => setActiveImage(img.imageUrl)}
                           className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer bg-slate-100 border-2 transition-all ${
                             activeImage === img.imageUrl ? 'border-primary' : 'border-transparent hover:border-slate-300'
                           }`}
                         >
                           <img className="w-full h-full object-cover" src={img.imageUrl} alt={`Thumbnail ${img.id}`} referrerPolicy="no-referrer" />
                         </div>
                       ))}
                     </div>
                   )}
                </div>

                {/* Description */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/60">
                   <h4 className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2"><Info size={16} />Mô tả chi tiết</h4>
                   <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{room.description || 'Không có mô tả.'}</p>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-5">
                 <div className="bg-white p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-slate-800 mb-2">Thông tin cơ bản</h4>
                    <InfoRow icon={<DollarSign size={16} />} label="Giá thuê / tháng" value={formatVND(room.price)} />
                    <InfoRow icon={<Ruler size={16} />} label="Diện tích" value={`${room.area} m²`} />
                    <InfoRow icon={<Tag size={16} />} label="Tình trạng phòng">
                       {(() => {
                         const m = {
                           AVAILABLE:   { t: 'Còn phòng trống', c: 'bg-green-100 text-green-700 border-green-200' },
                           ALMOST_FULL: { t: 'Sắp hết chỗ',    c: 'bg-amber-100 text-amber-700 border-amber-200' },
                           FULL:        { t: 'Đã hết chỗ',      c: 'bg-red-100 text-red-700 border-red-200' },
                         };
                         const s = m[room.status] ?? { t: room.status, c: 'bg-slate-100 text-slate-600 border-slate-200' };
                         return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${s.c}`}>{s.t}</span>;
                       })()}
                     </InfoRow>
                    <InfoRow icon={<ShieldCheck size={16} />} label="Trạng thái kiểm duyệt">
                       {(() => {
                         const m = {
                           PENDING_APPROVAL: { t: 'Đang chờ phê duyệt', c: 'bg-blue-100 text-blue-700 border-blue-200' },
                           APPROVED:         { t: 'Đã được phê duyệt',   c: 'bg-green-100 text-green-700 border-green-200' },
                           REJECTED:         { t: 'Bị từ chối',           c: 'bg-red-100 text-red-700 border-red-200' },
                           ADMIN_HIDDEN:     { t: 'Bị Admin ẩn bài',      c: 'bg-orange-100 text-orange-700 border-orange-200' },
                         };
                         const a = m[room.approvalStatus] ?? { t: room.approvalStatus, c: 'bg-slate-100 text-slate-600 border-slate-200' };
                         return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${a.c}`}>{a.t}</span>;
                       })()}
                     </InfoRow>
                    {room.rejectionReason && (
                      <InfoRow icon={<Info size={16} />} label="Lý do từ chối">
                        <p className="text-sm text-red-600 font-medium leading-relaxed mt-0.5">{room.rejectionReason}</p>
                      </InfoRow>
                    )}
                 </div>

                 <div className="bg-white p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-slate-800 mb-2">Người đăng</h4>
                    <InfoRow icon={<UserIcon size={16} />} label="Tên" value={room.creator?.userName || 'Không xác định'} />
                     <InfoRow icon={<Calendar size={16} />} label="Email" value={room.creator?.email} />
                    <InfoRow icon={<Calendar size={16} />} label="Ngày đăng" value={new Date(room.createdAt).toLocaleDateString('vi-VN')} />
                 </div>
                 
                 <div className="bg-white p-5 rounded-xl border border-slate-200/60">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Sparkles size={16}/>Tiện ích</h4>
                    {room.features?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {room.features.map(f => (
                          <span key={f.feature.id} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                            <Check size={14} className="text-green-600" />
                            {f.feature.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                       <p className="text-sm text-slate-500">Không có tiện ích nổi bật.</p>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ apiFetch }) {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // { id, name }

  const currentUserId = localStorage.getItem('userId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      const r = await apiFetch(`/users?${params}`);
      setUsers(r.data?.data || []);
      setMeta(r.data?.meta || {});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleBan = (id, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    confirmAction(isBanned ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?', async () => {
      try {
        await apiFetch(`/users/${id}/${action}`, { method: 'PATCH' });
        toast.success(isBanned ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <h2 className="text-xl font-black text-slate-800">Quản lý người dùng</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm theo email, tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="flex-1 sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không tìm thấy người dùng.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Người dùng</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden md:table-cell">Ngày tạo</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Phòng đăng</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center uppercase">
                            {(u.userName || u.email)[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{u.userName || '—'}</p>
                          <p className="text-slate-400 text-xs truncate max-w-[160px]">{u.email}</p>
                        </div>
                        {u.role === 'ADMIN' && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-primary/10 text-primary rounded-md">ADMIN</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">
                      {u._count?.roomsCreated ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="px-2 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full flex items-center gap-1 w-fit">
                          <UserX size={12} /> Đã khóa
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold bg-green-50 text-green-600 rounded-full flex items-center gap-1 w-fit">
                          <UserCheck size={12} /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser({ id: u.id, name: u.userName || u.email })}
                          className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                        >
                          Xem phòng
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleBan(u.id, u.isBanned)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                              u.isBanned
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {u.isBanned ? 'Mở khóa' : 'Khóa'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
      {selectedUser && (
        <UserRoomsModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          apiFetch={apiFetch}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// ─── Rooms Tab ────────────────────────────────────────────────────────────────
function RoomsTab({ apiFetch }) {
  const [rooms, setRooms] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('PENDING_APPROVAL');
  const [viewingRoomId, setViewingRoomId] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const navigate = useNavigate();

  // Load stats for summary bar
  useEffect(() => {
    apiFetch('/dashboard')
      .then((r) => setRoomStats(r.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (approvalStatus !== 'ALL') {
        params.set('approvalStatus', approvalStatus);
      }
      const r = await apiFetch(`/rooms?${params}`);
      setRooms(r.data?.data || []);
      setMeta(r.data?.meta || {});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, approvalStatus, apiFetch]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = (id, title) => {
    confirmAction(`Phê duyệt phòng trọ "${title}"?`, async () => {
      try {
        await apiFetch(`/rooms/${id}/approve`, { method: 'PATCH' });
        toast.success('Đã phê duyệt phòng trọ.');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  const handleReject = (id, title) => {
    promptAction(`Vui lòng nhập lý do từ chối phòng trọ "${title}":`, async (reason) => {
      if (!reason || reason.trim().length < 10) {
        toast.warn('Lý do từ chối là bắt buộc và phải dài ít nhất 10 ký tự.');
        return;
      }
      try {
        await apiFetch(`/rooms/${id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ rejectionReason: reason }),
        });
        toast.success('Đã từ chối phòng trọ.');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  const handleView = (id) => {
    setViewingRoomId(id);
  };


  const handleHide = (id, status) => {
    const isHidden = status === 'ADMIN_HIDDEN';
    const action = isHidden ? 'restore' : 'hide';
    const label = isHidden ? 'Hiện lại phòng này?' : 'Ẩn phòng này khỏi danh sách?';
    confirmAction(label, async () => {
      try {
        await apiFetch(`/rooms/${id}/${action}`, { method: 'PATCH' });
        toast.success(isHidden ? 'Đã hiện lại phòng trọ.' : 'Đã ẩn phòng trọ.');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  const handleDelete = (id, title) => {
    confirmAction(`Xóa vĩnh viễn phòng "${title}"?\n⚠️ Hành động này không thể hoàn tác!`, async () => {
      try {
        await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
        toast.success('Đã xóa phòng trọ vĩnh viễn.');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    });
  };

  const formatVND = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
  
  const renderStatus = (room) => {
    const statusTag = "px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-fit";
    switch (room.approvalStatus) {
      case 'APPROVED':
        if (room.creator?.isBanned) return <span className={`${statusTag} bg-red-50 text-red-700`}><EyeOff size={12} /> User bị khóa</span>;
        return <span className={`${statusTag} bg-green-50 text-green-600`}><ShieldCheck size={12} /> Đã duyệt</span>;
      case 'PENDING_APPROVAL':
        return <span className={`${statusTag} bg-blue-50 text-blue-600`}><ShieldCheck size={12} /> Chờ duyệt</span>;
      case 'REJECTED':
        return <span className={`${statusTag} bg-red-50 text-red-600`}><X size={12} /> Bị từ chối</span>;
      case 'ADMIN_HIDDEN':
        return <span className={`${statusTag} bg-orange-50 text-orange-600`}><EyeOff size={12} /> Ẩn (Admin)</span>;
      default:
        return null;
    }
  }

  const renderActions = (room) => {
    const btnSm = "px-3 py-1.5 text-xs font-bold rounded-lg transition";
    const status = room.approvalStatus;

    // Actions chung cho mọi trạng thái
    const commonActions = (
      <>
        <button onClick={() => handleView(room.id)} title="Xem chi tiết" className={`${btnSm} bg-slate-100 text-slate-700 hover:bg-slate-200`}>Xem</button>
        <button onClick={() => handleDelete(room.id, room.title)} title="Xóa vĩnh viễn" className={`${btnSm} bg-red-50 text-red-600 hover:bg-red-100`}>Xóa</button>
      </>
    );

    if (status === 'PENDING_APPROVAL') {
      return (
        <>
          <button onClick={() => handleApprove(room.id, room.title)} title="Duyệt nhanh" className={`${btnSm} bg-green-500 text-white hover:bg-green-600`}>Duyệt</button>
          <button onClick={() => handleView(room.id)} title="Xem chi tiết" className={`${btnSm} bg-blue-50 text-blue-700 hover:bg-blue-100`}>Xem</button>
          <button onClick={() => handleReject(room.id, room.title)} title="Từ chối" className={`${btnSm} bg-red-50 text-red-700 hover:bg-red-100`}>Từ chối</button>
        </>
      );
    }
    
    if (status === 'APPROVED') {
       return (
          <>
            <button onClick={() => handleView(room.id)} title="Xem chi tiết" className={`${btnSm} bg-slate-100 text-slate-700 hover:bg-slate-200`}>Xem</button>
            <button onClick={() => handleHide(room.id, room.approvalStatus)} title="Ẩn"
              className={`${btnSm} bg-orange-50 text-orange-700 hover:bg-orange-100`}>
              Ẩn
            </button>
          </>
        );
    }

    if (status === 'ADMIN_HIDDEN') {
       return (
          <>
            <button onClick={() => handleView(room.id)} title="Xem chi tiết" className={`${btnSm} bg-slate-100 text-slate-700 hover:bg-slate-200`}>Xem</button>
            <button onClick={() => handleHide(room.id, room.approvalStatus)} title="Hiện lại"
              className={`${btnSm} bg-green-50 text-green-700 hover:bg-green-100`}>
              Hiện lại
            </button>
          </>
        );
    }
    
    if (status === 'REJECTED') {
       return (
          <>
            <button onClick={() => handleApprove(room.id, room.title)} title="Duyệt lại" className={`${btnSm} bg-green-50 text-green-700 hover:bg-green-100`}>Duyệt lại</button>
            <button onClick={() => handleView(room.id)} title="Xem chi tiết" className={`${btnSm} bg-slate-100 text-slate-700 hover:bg-slate-200`}>Xem</button>
            <button onClick={() => handleDelete(room.id, room.title)} title="Xóa vĩnh viễn" className={`${btnSm} bg-red-50 text-red-600 hover:bg-red-100`}>Xóa</button>
          </>
        );
    }
    
    return commonActions;
  };

  const FILTER_STATUSES = [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
      { id: 'APPROVED', label: 'Đã duyệt' },
      { id: 'REJECTED', label: 'Bị từ chối' }
  ];

  // Stat summary items
  const statItems = [
    { id: 'ALL',              label: 'Tất cả',      count: roomStats?.totalRooms,       color: 'text-slate-700',   bg: 'bg-slate-100',   activeBg: 'bg-slate-700',   dot: 'bg-slate-500'  },
    { id: 'PENDING_APPROVAL', label: 'Chờ duyệt',   count: roomStats?.pendingRooms,     color: 'text-amber-700',   bg: 'bg-amber-50',    activeBg: 'bg-amber-500',   dot: 'bg-amber-400'  },
    { id: 'APPROVED',         label: 'Đã duyệt',    count: roomStats?.approvedRooms,    color: 'text-emerald-700', bg: 'bg-emerald-50',  activeBg: 'bg-emerald-600', dot: 'bg-emerald-400'},
    { id: 'REJECTED',         label: 'Bị từ chối',  count: roomStats?.rejectedRooms,    color: 'text-rose-700',    bg: 'bg-rose-50',     activeBg: 'bg-rose-600',    dot: 'bg-rose-400'   },
    { id: 'ADMIN_HIDDEN',     label: 'Ẩn (Admin)',  count: roomStats?.adminHiddenRooms, color: 'text-orange-700',  bg: 'bg-orange-50',   activeBg: 'bg-orange-500',  dot: 'bg-orange-400' },
  ];

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Quản lý phòng trọ</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng <span className="font-bold text-slate-600">{roomStats?.totalRooms ?? '…'}</span> phòng
            &nbsp;·&nbsp;
            <span className="text-amber-600 font-bold">{roomStats?.pendingRooms ?? 0} chờ duyệt</span>
            &nbsp;·&nbsp;
            <span className="text-emerald-600 font-bold">{roomStats?.approvedRooms ?? 0} đã duyệt</span>
            &nbsp;·&nbsp;
            <span className="text-orange-600 font-bold">{roomStats?.adminHiddenRooms ?? 0} ẩn (admin)</span>
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, địa chỉ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="flex-1 sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Stat summary cards + filter tabs — combined */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {statItems.map(item => {
          const isActive = approvalStatus === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setApprovalStatus(item.id); setPage(1); }}
              className={`w-full flex flex-col px-3 py-2 rounded-xl border transition-all text-left ${
                isActive
                  ? `${item.activeBg} text-white border-transparent shadow-md`
                  : `bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm`
              }`}
            >
              <p className={`text-sm font-black leading-none tabular-nums ${isActive ? 'text-white' : item.color}`}>
                {item.count ?? '0'}
              </p>
              <p className={`text-[10px] font-bold mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                {item.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không có phòng trọ nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Phòng trọ</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden lg:table-cell">Người đăng</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden md:table-cell">Giá</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room.id} className={`hover:bg-slate-50/60 transition-colors ${room.isHidden ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {room.images?.[0] ? (
                          <img src={room.images[0].imageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center">
                            <Home size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 leading-tight line-clamp-1 max-w-[200px]">{room.title}</p>
                          <p className="text-slate-400 text-xs truncate max-w-[200px]">{room.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      <p className="font-semibold">{room.creator?.userName || '—'}</p>
                      <p className="text-xs text-slate-400">{room.creator?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold hidden md:table-cell">
                      {formatVND(room.price)}
                    </td>
                    <td className="px-4 py-3">
                      {renderStatus(room)}
                       {approvalStatus === 'REJECTED' && room.rejectionReason && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2" title={room.rejectionReason}>Lý do: {room.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                         {renderActions(room)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
      {viewingRoomId && (
        <RoomDetailModal
          roomId={viewingRoomId}
          apiFetch={apiFetch}
          onClose={() => setViewingRoomId(null)}
        />
      )}
    </div>
  );
}

// ─── Main AdminPage ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'rooms', label: 'Phòng trọ', icon: Home },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { userEmail, userName, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalStats, setGlobalStats] = useState(null);
  const apiFetch = useAdminFetch();

  const userDisplayName = userName || userEmail?.split('@')[0] || 'Admin';

  useEffect(() => {
    apiFetch('/dashboard')
      .then(res => setGlobalStats(res.data))
      .catch(() => {});
  }, [apiFetch]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
              title="Về trang chủ"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <span className="font-black text-slate-800 text-base">Admin Panel</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-xs font-semibold text-slate-500">BK'S MAP</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-semibold text-slate-600">{userDisplayName}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-2 space-y-1 sticky top-20">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  {label}
                </div>
                {globalStats && id === 'users' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {globalStats.totalUsers || 0}
                  </span>
                )}
                {globalStats && id === 'rooms' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {globalStats.totalRooms || 0}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex justify-around items-center h-14 px-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all relative ${
                activeTab === id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {globalStats && (id === 'users' || id === 'rooms') && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] px-1 rounded-full border border-white">
                    {id === 'users' ? globalStats.totalUsers : globalStats.totalRooms}
                  </span>
                )}
              </div>
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {activeTab === 'dashboard' && <DashboardTab apiFetch={apiFetch} onSwitchTab={setActiveTab} />}
          {activeTab === 'users' && <UsersTab apiFetch={apiFetch} />}
          {activeTab === 'rooms' && <RoomsTab apiFetch={apiFetch} />}
        </main>
      </div>
    </div>
  );
}

