import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useListingStore } from '../stores/listingStore';
import { useAuthStore } from '../stores/authStore';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition, calculateDistance }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      calculateDistance(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function CreateListingView() {
  const navigate = useNavigate();
  const { editingListing: initialData, addListing } = useListingStore();
  const userEmail = useAuthStore((s) => s.userEmail);
  const onAddListing = (listing) => addListing(listing, userEmail);
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState(initialData?.type || 'Room');
  const [price, setPrice] = useState(initialData?.price || '2500000');
  const [area, setArea] = useState(initialData?.area || '20');
  const [distanceText, setDistanceText] = useState(initialData?.distanceText || 'Cách cổng phụ DUT 150m');
  const [address, setAddress] = useState(initialData?.address || 'Liên Chiểu, Đà Nẵng');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedAmenities, setSelectedAmenities] = useState(initialData?.amenities || ['WiFi tốc độ cao', 'Điều hòa nhiệt độ']);
  const [imageUrls, setImageUrls] = useState(initialData?.images || []);
  const [selectedFiles, setSelectedFiles] = useState([]); // Track File objects for backend upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [electricityPrice, setElectricityPrice] = useState(initialData?.electricityPrice || '');
  const [waterPrice, setWaterPrice] = useState(initialData?.waterPrice || '');
  const [otherCosts, setOtherCosts] = useState(initialData?.otherCosts || '');
  const [hostPhone, setHostPhone] = useState(initialData?.host?.phone || '');
  const [hostName, setHostName] = useState(initialData?.host?.name || '');

  // Default initial position to Bách Khoa if not editing existing lat/lng
  const [position, setPosition] = useState(initialData?.lat ? { lat: initialData.lat, lng: initialData.lng } : null);
  const [distanceDUT, setDistanceDUT] = useState(initialData?.distanceDUT || null);

  // Haversine formula
  const calculateDistance = (lat, lng) => {
    const dutLat = 16.07548;
    const dutLng = 108.14983;
    const R = 6371; // km
    const dLat = (lat - dutLat) * Math.PI / 180;
    const dLng = (lng - dutLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(dutLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    setDistanceDUT(dist);
    
    // Auto fill text
    if (dist < 1) {
      setDistanceText(`Cách ĐH Bách Khoa ${(dist * 1000).toFixed(0)}m`);
    } else {
      setDistanceText(`Cách ĐH Bách Khoa ${dist.toFixed(1)}km`);
    }
  };

  // Sample image presets for zero-fuss rapid prototyping testing
  const PHOTO_PRESETS = [
    { name: 'Loft Gỗ', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYQcvZOxr8H-mD-jWJ9BMYndfkhO41GGefBPnH2rSCgdH5ebP23MNRl03vyxs_azv9iv78NZsG8Ucwq1jtHOrLy7l-PUgvDXZttSfKiV7gPhDvkmeUSnXhlSsReKML2GoxwB4DkYVxBQSzO7oLXc4plZVWq9wKni8O7MwEBakq8Yuz7AS-bO91rRsjqu6igm_L1GtLYHjO5IE-uXVqBymH8X4r819FvQK-p0ey6toDSwPYEkXRQOvXaSnYufNQVQMKJQXd5yrP-A0' },
    { name: 'Studio Đèn Neon', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT1RC32rcZR248naSILiFJ7LgQ_ado-KrzJOZ7Z-F6iW_FYx7RPkLJ_quKPr9G-V2PCACSEXFU8_suLW8YwTL1aV9bobMGvNBg9bwm6_ByMXHR-VQ6QAmF29gZoQepp2OsSKnzrBr88STLh87UNGKArs6m4qhPpRwgixu1eqjLFGdFD1YZ7oy97p-4TGyuCQR9IakwRPhEQZDlrjz-e3kJthftLjz0IbQkpO8XJtH2jgTL3LkPRM5sx4HxU8hmkNj87yEKDazx0DU' },
    { name: 'Sân Vườn Nhiệt Đới', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaP71CMqVvbt2qY3xe3zzrsRlLH73ECfuHKYlhMoyV9c1BCvIH3ymwjnTCX5Z6kve6WdMqjkJsps7sXQliK0I34PZKNe9X2qBax1PMvSzsDjAQgXhRXGQbIUZ63D0Xx0JF_8LOpenmBESO31IYQx8o4e4flXwp9rQVi5y_Xyoy_rnrgvhJbqzqwPWgLohhuEOUH6kJyzem6qD-b97TROTRFm-xpVJ1lMdZa06Cpb8FyA7Ld-1jNy9ot-_AuiuWspvJEpKMCgJ4WWQ' }
  ];

  const AMENITY_OPTIONS = [
    'WiFi miễn phí',
    'Bàn học',
    'Giường ngủ',
    'Điều hòa',
    'Máy giặt',
    'Camera an ninh 24/7',
    'Giờ giấc tự do',
    'Không chung chủ',
    'Chung chủ',
    'Ban công thoáng đãng',
    'Chỗ để xe rộng rãi'
  ];

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const newFiles = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setImageUrls(prev => [...prev, ...newFiles.map(f => f.previewUrl)]);
  };

  const handleRemoveImage = (indexToRemove) => {
    const urlToRemove = imageUrls[indexToRemove];
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
    setSelectedFiles(prev => prev.filter(f => f.previewUrl !== urlToRemove));
  };

  const handleSaveListing = async () => {
    try {
      setUploadStatus('Đang khởi tạo thông tin phòng...');
      setIsUploading(true);

      const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      }

      // 1. Tạo phòng trên Backend Node.js
      const createRoomPayload = {
        title: title.trim() || 'Căn Hộ Sinh Viên',
        type: type,
        price: Number(String(price).replace(/\D/g, '')) || 1000,
        electricityPrice: electricityPrice ? Number(String(electricityPrice).replace(/\D/g, '')) || 0 : 0,
        waterPrice: waterPrice ? Number(String(waterPrice).replace(/\D/g, '')) || 0 : 0,
        distanceToBk: distanceDUT || 0.8,
        address: address.trim() || 'Đà Nẵng',
        ownerName: hostName || 'Người dùng BKMAP',
        ownerPhone: hostPhone || '0901234567',
        description: description.trim(),
        status: 'AVAILABLE',
        area: Number(area) || 20,
        latitude: position?.lat || 16.07548,
        longitude: position?.lng || 108.14983,
        // Map feature strings to IDs if needed by backend, keeping it empty for now if not strictly required
      };

      const isEditing = !!initialData?.id;
      const endpoint = isEditing ? `${apiUrl}/rooms/${initialData.id}` : `${apiUrl}/rooms`;
      const httpMethod = isEditing ? 'PATCH' : 'POST';

      if (isEditing) {
        // Chỉ lấy những url cũ thật (đã được lưu), loại bỏ các file preview (blob:)
        createRoomPayload.imageUrls = imageUrls.filter(url => !url.startsWith('blob:'));
      }

      const createRes = await fetch(endpoint, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createRoomPayload)
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || 'Lỗi khi tạo phòng trên server');
      }

      const createData = await createRes.json();
      const roomId = isEditing ? initialData.id : (createData.data?.room?.id || createData.room?.id);
      
      if (!roomId) {
        throw new Error('Không nhận được ID phòng từ hệ thống');
      }

      // 2. Upload hình ảnh đồng thời (Concurrency) để tối ưu tốc độ
      if (selectedFiles.length > 0) {
        let uploadedCount = 0;
        setUploadStatus(`Đang tải lên Supabase (0/${selectedFiles.length})...`);
        
        const uploadPromises = selectedFiles.map(async (fileObj, index) => {
          const formData = new FormData();
          formData.append('file', fileObj.file);
          formData.append('displayOrder', index);

          const uploadRes = await fetch(`${apiUrl}/rooms/${roomId}/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!uploadRes.ok) {
             console.warn('Lỗi khi tải lên một ảnh:', await uploadRes.text());
          }
          
          uploadedCount++;
          setUploadStatus(`Đang tải lên Supabase (${uploadedCount}/${selectedFiles.length})...`);
        });

        // Đợi tất cả request chạy song song hoàn tất
        await Promise.all(uploadPromises);
      }

      // 3. Fetch lại room từ backend để lấy Supabase URLs thực tế (thay vì blob: preview)
      setUploadStatus('Đang đồng bộ dữ liệu...');
      const roomRes = await fetch(`${apiUrl}/rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let realImageUrls = imageUrls; // Fallback
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        const roomDetail = roomData.data || roomData;
        if (roomDetail.images && roomDetail.images.length > 0) {
          realImageUrls = roomDetail.images
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((img) => img.imageUrl);
        }
      }

      // Cập nhật State cho UI hiển thị ngay lập tức
      const newHouse = {
        ...(initialData || {}),
        id: roomId,
        title: createRoomPayload.title,
        type: type,
        price: price,
        priceUSD: Math.round(price / 24800),
        distanceText: distanceText.trim() || 'Cách cổng chính ĐH Bách Khoa 800m',
        address: createRoomPayload.address,
        rating: 5.0,
        images: realImageUrls,
        host: { name: createRoomPayload.ownerName, phone: createRoomPayload.ownerPhone },
        amenities: selectedAmenities,
        description: description,
        status: 'AVAILABLE',
        area: area,
        lat: createRoomPayload.latitude,
        lng: createRoomPayload.longitude
      };

      onAddListing(newHouse);
      
      // Delay 100ms để React kịp cập nhật UI (ẩn spinner) trước khi bật alert block luồng
      setTimeout(() => {
        alert(initialData ? '🎉 Cập nhật thông tin thành công!' : '🎉 Đăng tin lên hệ thống thành công!');
        navigate('/dashboard');
      }, 100);
      
      
    } catch (error) {
      alert(`❌ Đã xảy ra lỗi: ${error.message}`);
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const formatVND = (num) => {
    return num.toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-10 animate-fade-in pb-28">
      
      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center gap-2 text-primary font-bold text-sm hover:underline cursor-pointer group"
      >
        <span className="material-symbols-outlined text-sm font-bold group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        <span>Hủy bỏ & Trở về bảng quản lý</span>
      </button>

      {/* Hero Header */}
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-2xl md:text-3xl font-black text-on-surface">
          {initialData ? 'Chỉnh sửa niêm yết' : 'Đăng ký niêm yết trọ mới'}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto">
          {initialData 
            ? 'Cập nhật lại thông tin để sinh viên có cái nhìn chính xác nhất về phòng trọ của bạn.' 
            : 'Hoàn thành quy trình 4 bước chuẩn hóa để tiếp cận hơn 5,000 sinh viên Đại học Bách Khoa Đà Nẵng đang có nhu cầu thiết thực.'}
        </p>
      </div>

      {/* PROGRESS STEP TRACKER BAR */}
      <div className="mb-10 max-w-xl mx-auto">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
          <div
            className="absolute left-0 top-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>

          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step >= num
                  ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                  : 'bg-slate-100 text-outline border-2 border-slate-200'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs font-bold text-outline mt-3">
          <span className={step >= 1 ? 'text-primary' : ''}>Cơ bản</span>
          <span className={step >= 2 ? 'text-primary' : ''}>Tiện ích</span>
          <span className={step >= 3 ? 'text-primary' : ''}>Ảnh chụp</span>
          <span className={step >= 4 ? 'text-primary' : ''}>Xác nhận</span>
        </div>
      </div>

      {/* Form Steps Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/60 shadow- premium">
        {/* STEP 1: Basic credentials */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-on-surface border-b pb-2">Bước 1: Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-1.5Col col-span-2">
                <label className="font-bold text-on-surface-variant">Tiêu đề tin đăng phòng:</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  placeholder="Ví dụ: Studio Gỗ Cao Cấp Gần Sát Cổng Khảo Thí DUT"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Phân loại phòng trọ:</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface cursor-pointer font-semibold"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Room">Room (Phòng trọ phổ thông)</option>
                  <option value="Studio">Studio (Căn hộ chung cư mini khép kín)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Giá cho thuê tháng (VND):</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-black text-primary"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Diện tích sàn (m²):</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-black text-primary"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Tên chủ trọ / Người đăng tin:</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-black"
                  placeholder="Ví dụ: Cô Lan, Chú Minh..."
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Số điện thoại liên hệ chủ trọ:</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-black"
                  placeholder="Ví dụ: 0901234567"
                  type="tel"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="font-bold text-on-surface-variant">Vị trí trên bản đồ (Tự động đo khoảng cách đến DUT):</label>
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                  <MapContainer center={[16.07548, 108.14983]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[16.07548, 108.14983]} opacity={0.5} /> {/* Bách Khoa marker */}
                    <LocationPicker position={position} setPosition={setPosition} calculateDistance={calculateDistance} />
                  </MapContainer>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Khoảng cách đến DUT:</label>
                <input
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none text-on-surface font-semibold text-primary"
                  placeholder="Hãy bấm chọn vị trí trên bản đồ..."
                  type="text"
                  value={distanceText}
                  onChange={(e) => setDistanceText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Địa chỉ chi tiết tại Đà Nẵng:</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  placeholder="Ví dụ: 12 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Description and Utilities checklist */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-on-surface border-b pb-2">Bước 2: Mô tả & Tiện ích đi kèm</h3>
            
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Tiền điện (VND):</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    placeholder="Ví dụ: 3500/KWh"
                    type="text"
                    value={electricityPrice}
                    onChange={(e) => setElectricityPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Tiền nước (VND):</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    placeholder="Ví dụ: 50k/người"
                    type="text"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Chi phí khác:</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    placeholder="Xe, rác, wifi..."
                    type="text"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Giới thiệu tổng quan phòng trọ:</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface leading-relaxed text-justify"
                  placeholder="Nhập các điểm cộng thế mạnh của căn phòng (gần chợ, không chung chủ, giờ giấc tự quản, ban công ngắm sông...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface-variant block">Chọn các tiện ích có sẵn ở phòng:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {AMENITY_OPTIONS.map((item) => {
                    const isChecked = selectedAmenities.includes(item);
                    return (
                      <div
                        key={item}
                        onClick={() => handleAmenityToggle(item)}
                        className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-primary/5 border-primary text-primary'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item}</span>
                        <span className="material-symbols-outlined text-sm">
                          {isChecked ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Images upload / presets links */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-on-surface border-b pb-2">Bước 3: Thêm hình ảnh thực tế phòng ở</h3>
            
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Tải ảnh lên từ máy tính:</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20
                      cursor-pointer"
                  />
                  {isUploading && <span className="text-sm text-slate-500 font-medium">Đang tải...</span>}
                </div>
                {imageUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="rounded-xl overflow-hidden border border-slate-200 h-24 relative group">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instant design presets */}
              <div className="bg-indigo-50/50 p-5 rounded-3xl space-y-3 border border-indigo-100">
                <p className="font-extrabold text-indigo-950 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">photo_library</span>
                  Chọn ảnh mẫu phòng có sẵn (Khuyên dùng thử nghiệm):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PHOTO_PRESETS.map((preset) => (
                    <div
                       key={preset.name}
                       onClick={() => setImageUrls(prev => prev.includes(preset.url) ? prev.filter(url => url !== preset.url) : [...prev, preset.url])}
                       className={`rounded-2xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-101 relative h-28 ${
                         imageUrls.includes(preset.url) ? 'border-primary ring-2 ring-primary/25 scale-102' : 'border-transparent'
                       }`}
                    >
                      <img
                        className="w-full h-full object-cover"
                        alt={preset.name}
                        src={preset.url}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 left-2 bg-on-surface/80 text-white font-bold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {preset.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Live preview & Confirm submission */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-extrabold text-on-surface border-b pb-2">Bước 4: Kiểm tra thông tin trực quan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center text-xs sm:text-sm">
              
              {/* Left Form credentials recap summary text code */}
              <div className="md:col-span-3 space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Chứng Thư Xác Nhận</span>
                
                <h4 className="text-base font-bold text-on-surface">Căn Hộ: {title || 'Chưa đặt tiêu đề'}</h4>
                <p className="font-semibold text-outline">Thể Loại: {type === 'Room' ? 'Phòng trọ sinh viên' : 'Căn hộ chung cư mini'}</p>
                
                <div className="space-y-1 pt-1.5 border-t border-slate-200">
                  <p className="flex items-center gap-1 text-on-surface-variant font-semibold">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    Vị Trí: {distanceText}
                  </p>
                  <p className="flex items-center gap-1 text-on-surface-variant font-semibold">
                    <span className="material-symbols-outlined text-sm">euro_symbol</span>
                    Địa chỉ hợp đồng: {address}
                  </p>
                  <p className="font-black text-primary text-base">
                    Giá phòng: {formatVND(price)}/tháng
                  </p>
                </div>

                <div className="pt-2">
                  <span className="font-black">Mô tả tóm lược:</span>
                  <p className="text-outline text-justify mt-1">
                    {description || 'Chưa cung cấp bài viết giới thiệu phòng.'}
                  </p>
                </div>
              </div>

              {/* Right generated card live design element */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-premium flex flex-col hover:-translate-y-1 transition-transform max-w-[280px] mx-auto scale-95 sm:scale-100">
                  <div className="relative h-32 bg-slate-100">
                    <img
                      className="w-full h-full object-cover"
                      alt="Preview placeholder logo"
                      src={imageUrls[0] || PHOTO_PRESETS[0].url}
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                      MỚI ĐĂNG
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-primary">
                      <span>{type}</span>
                      <span className="text-amber-500 flex items-center gap-0.5">⭐ 5.0</span>
                    </div>
                    <h5 className="font-bold text-xs text-on-surface truncate leading-tight">{title || 'Căn Hộ Trống Mẫu'}</h5>
                    <p className="text-[10px] text-on-surface-variant truncate">{distanceText}</p>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black text-primary">{formatVND(price)}/th</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">Hoạt động</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Wizard Footer controls */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-10">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
              step === 1
                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-outline'
                : 'bg-white text-on-surface border border-outline-variant hover:bg-slate-50'
            }`}
          >
            Quay lại
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-7 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>Xem tiếp</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSaveListing}
              disabled={isUploading}
              className={`text-white text-xs sm:text-sm font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl flex items-center gap-1.5 ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'}`}
            >
              {isUploading ? (
                <>
                  <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                  <span>{uploadStatus || 'ĐANG XỬ LÝ...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  <span>{initialData ? 'CẬP NHẬT' : 'LƯU & ĐĂNG BÀI'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
