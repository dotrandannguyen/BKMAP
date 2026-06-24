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
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api'
    ? import.meta.env.VITE_API_URL
    : `http://${window.location.hostname}:3000/api`;

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
function StatCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ apiFetch }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch('/dashboard')
      .then((r) => setStats(r.data))
      .catch((e) => toast.error(e.message));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-black text-slate-800 mb-6">Tổng quan hệ thống</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Tổng người dùng" value={stats?.totalUsers} icon={<Users size={22} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Tổng phòng trọ" value={stats?.totalRooms} icon={<Home size={22} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard label="Phòng đang hiển thị" value={stats?.activeRooms} icon={<Eye size={22} className="text-green-600" />} color="bg-green-50" />
        <StatCard label="Phòng bị ẩn" value={stats?.hiddenRooms} icon={<EyeOff size={22} className="text-orange-600" />} color="bg-orange-50" />
        <StatCard label="Tài khoản bị khóa" value={stats?.bannedUsers} icon={<Ban size={22} className="text-red-600" />} color="bg-red-50" />
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

  const handleHide = async (id, isHidden) => {
    const action = isHidden ? 'restore' : 'hide';
    const label = isHidden ? 'Hiện lại phòng này?' : 'Ẩn phòng này khỏi danh sách?';
    if (!window.confirm(label)) return;
    try {
      await apiFetch(`/rooms/${id}/${action}`, { method: 'PATCH' });
      toast.success(isHidden ? 'Đã hiện lại phòng trọ.' : 'Đã ẩn phòng trọ.');
      loadRooms();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa vĩnh viễn phòng "${title}"?\n⚠️ Hành động này không thể hoàn tác!`)) return;
    try {
      await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa phòng trọ vĩnh viễn.');
      loadRooms();
    } catch (e) {
      toast.error(e.message);
    }
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

  const handleBan = async (id, isBanned) => {
    const action = isBanned ? 'unban' : 'ban';
    const confirm = window.confirm(isBanned ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?');
    if (!confirm) return;
    try {
      await apiFetch(`/users/${id}/${action}`, { method: 'PATCH' });
      toast.success(isBanned ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      const r = await apiFetch(`/rooms?${params}`);
      setRooms(r.data?.data || []);
      setMeta(r.data?.meta || {});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleHide = async (id, isHidden) => {
    const action = isHidden ? 'restore' : 'hide';
    const label = isHidden ? 'Hiện lại phòng này?' : 'Ẩn phòng này khỏi danh sách?';
    if (!window.confirm(label)) return;
    try {
      await apiFetch(`/rooms/${id}/${action}`, { method: 'PATCH' });
      toast.success(isHidden ? 'Đã hiện lại phòng trọ.' : 'Đã ẩn phòng trọ.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa vĩnh viễn phòng "${title}"?\n⚠️ Hành động này không thể hoàn tác!`)) return;
    try {
      await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa phòng trọ vĩnh viễn.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatVND = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <h2 className="text-xl font-black text-slate-800">Quản lý phòng trọ</h2>
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
                      {room.isHidden ? (
                        <span className="px-2 py-1 text-xs font-bold bg-orange-50 text-orange-600 rounded-full flex items-center gap-1 w-fit">
                          <EyeOff size={12} /> Đang ẩn
                        </span>
                      ) : room.creator?.isBanned ? (
                        <span className="px-2 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full flex items-center gap-1 w-fit">
                          <EyeOff size={12} /> Bị ẩn (Khóa user)
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold bg-green-50 text-green-600 rounded-full flex items-center gap-1 w-fit">
                          <Eye size={12} /> Hiển thị
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleHide(room.id, room.isHidden || room.creator?.isBanned)}
                          title={room.isHidden || room.creator?.isBanned ? 'Hiện lại' : 'Ẩn phòng'}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
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
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={15} />
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
      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
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
  const apiFetch = useAdminFetch();

  const userDisplayName = userName || userEmail?.split('@')[0] || 'Admin';

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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={17} />
                {label}
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
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
                activeTab === id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {activeTab === 'dashboard' && <DashboardTab apiFetch={apiFetch} />}
          {activeTab === 'users' && <UsersTab apiFetch={apiFetch} />}
          {activeTab === 'rooms' && <RoomsTab apiFetch={apiFetch} />}
        </main>
      </div>
    </div>
  );
}
