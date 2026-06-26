import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useListingStore } from '../stores/listingStore';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify';
import { z } from 'zod';

const step1Schema = z.object({
  title: z.string().min(5, 'Tiêu đề tin phải từ 5 ký tự trở lên.').max(150, 'Tiêu đề không được vượt quá 150 ký tự.'),
  price: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ required_error: 'Vui lòng nhập giá thuê.' })
      .positive('Giá thuê phải lớn hơn 0.')
      .max(9000000000000000, 'Giá thuê quá lớn.')
  ),
  area: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number()
      .positive('Diện tích phải lớn hơn 0.')
      .max(1000, 'Diện tích không hợp lệ.')
      .optional()
  ),
  hostPhone: z.string()
    .min(1, 'Vui lòng nhập số điện thoại.')
    .regex(/^\d{10}$/, 'Số điện thoại không hợp lệ, phải gồm đúng 10 chữ số.'),
  address: z.string().min(1, 'Vui lòng chọn hoặc nhập địa chỉ chi tiết.'),
  position: z.object({
    lat: z.number(),
    lng: z.number()
  }, { required_error: 'Vui lòng chọn vị trí phòng trọ trên bản đồ.' })
});

const step2Schema = z.object({
  description: z.string().min(10, 'Giới thiệu tổng quan phải từ 10 ký tự trở lên để người thuê dễ hình dung.'),
  electricityPrice: z.string().optional(),
  waterPrice: z.string().optional(),
  otherCosts: z.string().optional()
});

const step3Schema = z.object({
  imagesCount: z.number().min(1, 'Vui lòng tải lên ít nhất 1 hình ảnh.')
});

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const schoolIcon = L.divIcon({
  html: `
    <div class="flex flex-col items-center">
      <div class="w-7 h-7 rounded-full bg-red-600 border border-white shadow-md flex items-center justify-center">
        <span class="material-symbols-outlined text-white" style="font-size: 14px;">school</span>
      </div>
    </div>
  `,
  className: 'school-div-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

function LocationPicker({ position, setPosition, calculateDistance, onPositionChange }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      calculateDistance(e.latlng.lat, e.latlng.lng);
      if (onPositionChange) {
        onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapViewCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16);
    }
  }, [position, map]);
  return null;
}




export default function CreateListingView() {
  const navigate = useNavigate();
  const { 
    editingListing: initialData, 
    addListing, 
    setEditingListing,
  } = useListingStore();
  const userEmail = useAuthStore((s) => s.userEmail);
  const userName = useAuthStore((s) => s.userName);
  const userRole = useAuthStore((s) => s.userRole);
  const onAddListing = (listing) => addListing(listing, userEmail);
  const [step, setStep] = useState(1);

  // Dọn dẹp trạng thái chỉnh sửa khi rời khỏi trang
  useEffect(() => {
    return () => {
      setEditingListing(null);
    };
  }, [setEditingListing]);

  // Cuộn lên đầu trang khi đổi bước (Step)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState(initialData?.type || 'Trọ');
  const [price, setPrice] = useState(initialData?.price || '');
  const [area, setArea] = useState(initialData?.area || '');
  const [distanceText, setDistanceText] = useState(initialData?.distanceText || 'Cách cổng phụ DUT 150m');
  const [address, setAddress] = useState(initialData?.address || 'Phường Liên Chiểu, Thành phố Đà Nẵng');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedAmenities, setSelectedAmenities] = useState(initialData?.amenities || []);
  const [imageUrls, setImageUrls] = useState(initialData?.images || []);
  const [selectedFiles, setSelectedFiles] = useState([]); // Track File objects for backend upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateSingleField = (name, val) => {
    let schema;
    if (step === 1) {
      if (name in step1Schema.shape) {
        schema = step1Schema.pick({ [name]: true });
      }
    } else if (step === 2) {
      if (name in step2Schema.shape) {
        schema = step2Schema.pick({ [name]: true });
      }
    } else if (step === 3) {
      if (name === 'imagesCount') {
        schema = step3Schema;
      }
    }
    
    if (!schema) return;
    
    const result = schema.safeParse({ [name]: val });
    if (!result.success) {
      const msg = result.error.issues[0]?.message || 'Không hợp lệ';
      setValidationErrors(prev => ({ ...prev, [name]: msg }));
    } else {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Map Search States
  const [createSearchQuery, setCreateSearchQuery] = useState('');
  const [createSearchSuggestions, setCreateSearchSuggestions] = useState([]);
  const [isSearchingCreate, setIsSearchingCreate] = useState(false);
  const [electricityPrice, setElectricityPrice] = useState(initialData?.electricityPrice || '');
  const [waterPrice, setWaterPrice] = useState(initialData?.waterPrice || '');
  const [otherCosts, setOtherCosts] = useState(initialData?.otherCosts || '');
  
  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [hostPhone, setHostPhone] = useState(initialData?.host?.phone || '');
  const [hostName, setHostName] = useState(initialData?.host?.name || userName || '');

  // Default initial position to Bách Khoa if not editing existing lat/lng
  const [position, setPosition] = useState(initialData?.lat ? { lat: initialData.lat, lng: initialData.lng } : null);
  const [distanceDUT, setDistanceDUT] = useState(initialData?.distanceDUT || null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);

  // Compute isDirty dynamically
  const isDirty = useMemo(() => {
    if (isSuccess) return false;
    if (initialData) {
      return (
        title !== (initialData.title || '') ||
        type !== (initialData.type || 'Trọ') ||
        price !== (initialData.price || '') ||
        area !== (initialData.area || '') ||
        description !== (initialData.description || '') ||
        hostPhone !== (initialData.host?.phone || '') ||
        electricityPrice !== (initialData.electricityPrice || '') ||
        waterPrice !== (initialData.waterPrice || '') ||
        otherCosts !== (initialData.otherCosts || '') ||
        selectedFiles.length > 0
      );
    }
    return (
      title !== '' ||
      price !== '' ||
      area !== '' ||
      description !== '' ||
      hostPhone !== '' ||
      electricityPrice !== '' ||
      waterPrice !== '' ||
      otherCosts !== '' ||
      selectedFiles.length > 0 ||
      imageUrls.length > 0 ||
      position !== null
    );
  }, [title, type, price, area, description, hostPhone, electricityPrice, waterPrice, otherCosts, selectedFiles, imageUrls, position, initialData, isSuccess]);

  // Hook to block route transitions and page unloads
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && isDirty) {
        e.preventDefault();
        e.stopPropagation();
        setNextUrl(anchor.getAttribute('href'));
        setIsConfirmModalOpen(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleGlobalClick, true); // Capture phase

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isDirty]);

  // Haversine formula (used as a fallback)
  const calculateHaversine = (lat, lng) => {
    const dutLat = 16.07548;
    const dutLng = 108.14983;
    const R = 6371; // km
    const dLat = (lat - dutLat) * Math.PI / 180;
    const dLng = (lng - dutLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(dutLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance using OSRM walking path, falling back to Haversine
  const calculateDistance = async (lat, lng) => {
    const dutLat = 16.07548;
    const dutLng = 108.14983;
    try {
      // Use foot routing for students walking to campus
      const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${dutLng},${dutLat};${lng},${lat}?overview=false`);
      if (!res.ok) throw new Error('OSRM API request failed');
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const dist = data.routes[0].distance / 1000; // convert to km
        setDistanceDUT(dist);
        if (dist < 1) {
          setDistanceText(`Cách ĐH Bách Khoa ${(dist * 1000).toFixed(0)}m`);
        } else {
          setDistanceText(`Cách ĐH Bách Khoa ${dist.toFixed(1)}km`);
        }
        return;
      }
      throw new Error('Invalid route response');
    } catch (error) {
      console.warn('OSRM routing failed, using Haversine formula fallback:', error);
      const dist = calculateHaversine(lat, lng);
      setDistanceDUT(dist);
      if (dist < 1) {
        setDistanceText(`Cách ĐH Bách Khoa ${(dist * 1000).toFixed(0)}m`);
      } else {
        setDistanceText(`Cách ĐH Bách Khoa ${dist.toFixed(1)}km`);
      }
    }
  };

  const handleCreateSearch = async (query) => {
    if (!query.trim()) {
      setCreateSearchSuggestions([]);
      return;
    }
    setIsSearchingCreate(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
      const res = await fetch(`${apiUrl}/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          toast.warning('Không tìm thấy vị trí này. Vui lòng thử lại với từ khóa khác chi tiết hơn (Ví dụ: 280 Điện Biên Phủ, Đà Nẵng).');
        }
        setCreateSearchSuggestions(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`Lỗi tìm kiếm: ${errData.message || 'Yêu cầu thất bại'}`);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      toast.error(`Lỗi kết nối server: ${error.message}. Hãy chắc chắn rằng Backend của bạn đang chạy.`);
    } finally {
      setIsSearchingCreate(false);
    }
  };

  const handleSelectCreateLocation = (loc) => {
    const lat = parseFloat(loc.lat);
    const lon = parseFloat(loc.lon);
    
    // Set position
    const newPos = { lat, lng: lon };
    setPosition(newPos);
    
    // Clean address string (remove zip code and country name)
    let cleanAddress = loc.display_name || '';
    cleanAddress = cleanAddress.replace(/,\s*Việt\s*Nam$/i, '');
    cleanAddress = cleanAddress.replace(/,\s*\d{5,6}/g, '');

    // Set address input field to show the selected address
    setAddress(cleanAddress);
    
    // Calculate distance
    calculateDistance(lat, lon);
    
    // Clear suggestions
    setCreateSearchSuggestions([]);

    // Validate immediately
    validateSingleField('position', newPos);
    validateSingleField('address', cleanAddress);
  };

  const handleClearCreateSearch = () => {
    setCreateSearchQuery('');
    setCreateSearchSuggestions([]);
    setIsSearchingCreate(false);
  };

  // Autocomplete search as user types with debounce
  useEffect(() => {
    if (!createSearchQuery.trim()) {
      setCreateSearchSuggestions([]);
      setIsSearchingCreate(false);
      return;
    }
    setIsSearchingCreate(true);
    const timer = setTimeout(() => {
      const handleAutocompleteSearch = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3000/api' ? import.meta.env.VITE_API_URL : `http://${window.location.hostname}:3000/api`;
          const res = await fetch(`${apiUrl}/geocode?q=${encodeURIComponent(createSearchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setCreateSearchSuggestions(data);
          }
        } catch (error) {
          console.error('Error autocomplete searching address:', error);
        } finally {
          setIsSearchingCreate(false);
        }
      };
      handleAutocompleteSearch();
    }, 450); // 450ms debounce

    return () => clearTimeout(timer);
  }, [createSearchQuery]);

  // Clear images count validation error when images are uploaded/selected
  useEffect(() => {
    if (step === 3 && validationErrors.imagesCount) {
      const totalImages = imageUrls.length + selectedFiles.length;
      validateSingleField('imagesCount', totalImages);
    }
  }, [imageUrls.length, selectedFiles.length, step, validationErrors.imagesCount]);

  const handleNextStep = () => {
    setValidationErrors({});
    if (step === 1) {
      const result = step1Schema.safeParse({
        title,
        price,
        area,
        hostPhone,
        address,
        position: position || undefined
      });
      if (!result.success) {
        const errorsMap = {};
        result.error.issues.forEach(issue => {
          errorsMap[issue.path[0]] = issue.message;
        });
        setValidationErrors(errorsMap);
        
        // Show first error as a toast warning
        const firstErrorMsg = result.error.issues[0].message;
        toast.warning(firstErrorMsg);
        return;
      }
    } else if (step === 2) {
      const result = step2Schema.safeParse({
        description,
        electricityPrice,
        waterPrice,
        otherCosts
      });
      if (!result.success) {
        const errorsMap = {};
        result.error.issues.forEach(issue => {
          errorsMap[issue.path[0]] = issue.message;
        });
        setValidationErrors(errorsMap);
        
        const firstErrorMsg = result.error.issues[0].message;
        toast.warning(firstErrorMsg);
        return;
      }
    } else if (step === 3) {
      const totalImages = imageUrls.length + selectedFiles.length;
      const result = step3Schema.safeParse({
        imagesCount: totalImages
      });
      if (!result.success) {
        const errorsMap = {};
        result.error.issues.forEach(issue => {
          errorsMap[issue.path[0]] = issue.message;
        });
        setValidationErrors(errorsMap);
        
        const firstErrorMsg = result.error.issues[0].message;
        toast.warning(firstErrorMsg);
        return;
      }
    }
    setStep(step + 1);
  };



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

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    let allowedFiles = files;
    if (selectedFiles.length + files.length > 10) {
      toast.warning('Chỉ được phép tải lên tối đa 10 ảnh. Các ảnh thừa sẽ bị bỏ qua.');
      allowedFiles = files.slice(0, 10 - selectedFiles.length);
    }

    if (allowedFiles.length === 0) return;

    const newFiles = allowedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setImageUrls(prev => [...prev, ...newFiles.map(f => f.previewUrl)]);
  };

  const handleImageUpload = (e) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (!isUploading && e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
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
        electricityPrice: electricityPrice ? String(electricityPrice) : '',
        waterPrice: waterPrice ? String(waterPrice) : '',
        otherCosts: otherCosts.trim(),
        distanceToBk: distanceDUT !== null ? Number(distanceDUT) : 0.8,
        address: address.trim() || 'Đà Nẵng',
        ownerName: hostName || userName || 'Người dùng BKMAP',
        ownerPhone: hostPhone,
        description: description.trim(),
        status: 'AVAILABLE',
        area: Number(area) || 20,
        latitude: position?.lat || 16.07380,
        longitude: position?.lng || 108.14990,
        features: selectedAmenities,
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
        const errData = await createRes.json().catch(() => ({}));
        if (errData.errors) {
           const fieldNames = {
             title: 'Tiêu đề',
             address: 'Địa chỉ',
             latitude: 'Vĩ độ',
             longitude: 'Kinh độ',
             distanceToBk: 'Khoảng cách đến Bách Khoa',
             price: 'Giá thuê',
             area: 'Diện tích',
             ownerName: 'Tên chủ trọ',
             ownerPhone: 'Số điện thoại',
             electricityPrice: 'Giá điện',
             waterPrice: 'Giá nước',
             imageUrls: 'Hình ảnh'
           };
           
           const errorMessages = Object.entries(errData.errors)
             .map(([key, msg]) => {
                const fieldName = fieldNames[key] || key;
                let userMsg = msg;
                if (typeof msg === 'string') {
                  const lowerMsg = msg.toLowerCase();
                  if (lowerMsg.includes('expected number, received string')) userMsg = 'Phải là một số hợp lệ';
                  else if (lowerMsg.includes('too big')) userMsg = 'Giá trị quá lớn, vui lòng kiểm tra lại';
                  else if (lowerMsg.includes('invalid input')) userMsg = 'Dữ liệu không hợp lệ';
                }
                return `[${fieldName}]: ${userMsg}`;
             })
             .join('; ');
           throw new Error(`Vui lòng kiểm tra lại thông tin: ${errorMessages}`);
        }
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
        setUploadStatus(`Đang đăng (0/${selectedFiles.length})...`);
        
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
             toast.error('Tải lên một số ảnh thất bại. Vui lòng thử lại.');
          }
          
          uploadedCount++;
          setUploadStatus(`Đang đăng (${uploadedCount}/${selectedFiles.length})...`);
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
        lng: createRoomPayload.longitude,
        electricityPrice: createRoomPayload.electricityPrice,
        waterPrice: createRoomPayload.waterPrice,
        otherCosts: createRoomPayload.otherCosts,
      };

      onAddListing(newHouse);
      
      setIsSuccess(true);

      if (isEditing) {
        // Thông báo rõ ràng: bài đăng đang chờ Admin duyệt và tạm thời ẩn
        toast.info('✏️ Yêu cầu chỉnh sửa đã được gửi! Bài đăng sẽ được ẩn cho đến khi Admin xem xét và phê duyệt.', {
          autoClose: 5000,
        });
      } else {
        toast.success('🎉 Đăng ký thành công! Bài đăng đang chờ Admin phê duyệt.');
      }

      setTimeout(() => {
        navigate(userRole === 'ADMIN' ? '/admin' : '/dashboard');
      }, 2000);
      
      
    } catch (error) {
      toast.error(`❌ Đã xảy ra lỗi: ${error.message}`);
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
        onClick={() => {
          const targetUrl = userRole === 'ADMIN' ? '/admin' : '/dashboard';
          if (isDirty) {
            setNextUrl(targetUrl);
            setIsConfirmModalOpen(true);
          } else {
            navigate(targetUrl);
          }
        }}
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
            : 'Hoàn thành quy trình 4 bước chuẩn hóa để tiếp cận sinh viên Đại học Bách Khoa Đà Nẵng đang có nhu cầu thiết thực.'}
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
              <div className="space-y-1.5 col-span-2">
                <label className={`font-bold transition-colors ${validationErrors.title ? 'text-red-600' : 'text-on-surface-variant'}`}>Tiêu đề tin đăng phòng:</label>
                <input
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface transition-all ${
                    validationErrors.title
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Ví dụ: Studio Gỗ Cao Cấp Gần Sát Cổng Khảo Thí DUT"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    validateSingleField('title', e.target.value);
                  }}
                  onBlur={(e) => validateSingleField('title', e.target.value)}
                />
                {validationErrors.title && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Phân loại phòng trọ:</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface cursor-pointer font-semibold"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Room">Trọ</option>
                  <option value="Studio">Căn hộ chung cư mini</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={`font-bold transition-colors ${validationErrors.price ? 'text-red-600' : 'text-on-surface-variant'}`}>
                  Giá cho thuê tháng (VND):
                </label>
                <input
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface font-black transition-all ${
                    validationErrors.price
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Ví dụ: 1.000.000"
                  type="text"
                  value={price ? Number(price).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    const numVal = rawVal === '' ? '' : Number(rawVal);
                    setPrice(numVal);
                    validateSingleField('price', numVal);
                  }}
                  onBlur={() => validateSingleField('price', price)}
                />
                {validationErrors.price && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={`font-bold transition-colors ${validationErrors.area ? 'text-red-600' : 'text-on-surface-variant'}`}>Diện tích sàn (m²):</label>
                <input
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface font-black transition-all ${
                    validationErrors.area
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Ví dụ: 20"
                  type="number"
                  value={area}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = val === '' ? '' : Number(val);
                    setArea(numVal);
                    validateSingleField('area', numVal);
                  }}
                  onBlur={() => validateSingleField('area', area)}
                />
                {validationErrors.area && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.area}</p>
                )}
              </div>

              {/* <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Tên chủ trọ / Người đăng tin:</label>
                <input
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface font-black"
                  placeholder="Ví dụ: Cô Lan, Chú Minh..."
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div> */}

              <div className="space-y-1.5">
                <label className={`font-bold transition-colors ${validationErrors.hostPhone ? 'text-red-600' : 'text-on-surface-variant'}`}>
                  Số điện thoại liên hệ chủ trọ:
                </label>
                <input
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface font-black transition-all ${
                    validationErrors.hostPhone
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Ví dụ: 0901234567"
                  type="tel"
                  value={hostPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setHostPhone(val);
                    validateSingleField('hostPhone', val);
                  }}
                  onBlur={() => validateSingleField('hostPhone', hostPhone)}
                />
                {validationErrors.hostPhone && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.hostPhone}</p>
                )}
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="font-bold text-on-surface-variant">Vị trí trên bản đồ:</label>
                
                {/* Search Address Bar */}
                <div className="relative mb-2">
                  <div className="relative flex items-center bg-white rounded-xl shadow-xs border border-slate-200 focus-within:ring-1 focus-within:ring-primary p-0.5">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-lg pointer-events-none select-none">
                      search
                    </span>
                    <input
                      type="text"
                      className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent py-2.5 pl-10 pr-16 focus:outline-none placeholder-slate-400 border-none"
                      placeholder="Tìm vị trí nhanh (Ví dụ: 280 Điện Biên Phủ, Đà Nẵng)..."
                      value={createSearchQuery}
                      onChange={(e) => {
                        setCreateSearchQuery(e.target.value);
                        if (!e.target.value.trim()) {
                          setCreateSearchSuggestions([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // prevent form submission
                          handleCreateSearch(createSearchQuery);
                        }
                      }}
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                      {isSearchingCreate ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : createSearchQuery && (
                        <button
                          type="button"
                          onClick={handleClearCreateSearch}
                          className="material-symbols-outlined text-slate-400 hover:text-slate-600 cursor-pointer text-base p-0.5 select-none border-none bg-transparent"
                          title="Xóa tìm kiếm"
                        >
                          close
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCreateSearch(createSearchQuery)}
                        className="bg-primary text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center cursor-pointer border-none shadow-xs"
                        title="Tìm kiếm"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Suggestions List Dropdown */}
                  {createSearchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200/60 max-h-48 overflow-y-auto z-[1000] py-1 divide-y divide-slate-100">
                      {createSearchSuggestions.map((loc, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectCreateLocation(loc)}
                          className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary cursor-pointer transition-all flex items-start gap-2 leading-tight text-left"
                        >
                          <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5 select-none">location_on</span>
                          <div className="overflow-hidden">
                            <span className="block font-bold text-slate-800 text-[11px] truncate">{loc.display_name.split(',')[0]}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 truncate">{loc.display_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                 {/* Map picker frame */}
                <div className={`h-[300px] w-full rounded-xl overflow-hidden border shadow-sm relative z-0 transition-all ${
                  validationErrors.position ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
                }`}>
                  <MapContainer center={[16.07380, 108.14990]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[16.07380, 108.14990]} icon={schoolIcon} /> {/* Bách Khoa marker */}
                    <LocationPicker 
                      position={position} 
                      setPosition={setPosition} 
                      calculateDistance={calculateDistance} 
                      onPositionChange={(pos) => validateSingleField('position', pos)}
                    />
                    <MapViewCenter position={position} />
                  </MapContainer>
                </div>
                {validationErrors.position && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.position}</p>
                )}
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
                <label className={`font-bold transition-colors ${validationErrors.address ? 'text-red-600' : 'text-on-surface-variant'}`}>Địa chỉ chi tiết tại Đà Nẵng:</label>
                <input
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface transition-all ${
                    validationErrors.address
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Ví dụ: 12 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    validateSingleField('address', e.target.value);
                  }}
                  onBlur={(e) => validateSingleField('address', e.target.value)}
                />
                {validationErrors.address && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.address}</p>
                )}
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
                <label className={`font-bold transition-colors ${validationErrors.description ? 'text-red-600' : 'text-on-surface-variant'}`}>Giới thiệu tổng quan phòng trọ:</label>
                <textarea
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 border focus:outline-none focus:ring-1 text-on-surface leading-relaxed text-justify transition-all ${
                    validationErrors.description
                      ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-500'
                      : 'border-slate-200 focus:ring-primary'
                  }`}
                  placeholder="Nhập các điểm cộng thế mạnh của căn phòng (gần chợ, không chung chủ, giờ giấc tự quản, ban công ngắm sông...)"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    validateSingleField('description', e.target.value);
                  }}
                  onBlur={(e) => validateSingleField('description', e.target.value)}
                />
                {validationErrors.description && (
                  <p className="text-[10px] text-red-500 font-bold animate-fade-in mt-1">{validationErrors.description}</p>
                )}
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
                <label className="font-bold text-on-surface-variant mb-2 block">Tải ảnh lên từ thiết bị:</label>
                
                <div 
                  className={`relative border-2 border-dashed rounded-3xl transition-colors flex flex-col items-center justify-center p-10 cursor-pointer group overflow-hidden ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    title="Nhấn để tải ảnh lên"
                  />
                  
                  <div className={`w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary mb-4 transition-transform ${isUploading ? 'animate-bounce' : 'group-hover:scale-110'}`}>
                    <span className="material-symbols-outlined text-3xl">
                      {isUploading ? 'hourglass_empty' : 'cloud_upload'}
                    </span>
                  </div>
                  
                  <p className="font-bold text-slate-700 text-base">
                    {isUploading ? 'Đang tải ảnh lên...' : 'Nhấn để chọn ảnh hoặc kéo thả vào đây'}
                  </p>
                  {!isUploading && (
                    <p className="text-slate-500 text-xs mt-2 font-medium">Hỗ trợ JPG, PNG, WEBP</p>
                  )}
                  
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
                {validationErrors.imagesCount && (
                  <p className="text-xs text-red-500 font-bold animate-fade-in mt-2 text-center bg-red-50 p-2.5 rounded-xl border border-red-100">{validationErrors.imagesCount}</p>
                )}
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
                <p className="font-semibold text-outline">Thể Loại: {type === 'Trọ' ? 'Phòng trọ sinh viên' : 'Căn hộ chung cư mini'}</p>
                
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
                      src={imageUrls[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'}
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
                      <span className="text-xs font-black text-primary">{formatVND(price)}/tháng</span>
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
              onClick={handleNextStep}
              className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-7 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>Xem tiếp</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSaveListing}
              disabled={isUploading || isSuccess}
              className={`text-white text-xs sm:text-sm font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl flex items-center gap-1.5 ${
                isSuccess
                  ? 'bg-red-600 cursor-not-allowed'
                  : isUploading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'
              }`}
            >
              {isSuccess ? (
                <>
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  <span>{initialData ? 'ĐÃ CẬP NHẬT' : 'ĐÃ ĐĂNG'}</span>
                </>
              ) : isUploading ? (
                <>
                  <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                  <span>{uploadStatus || 'ĐANG XỬ LÝ...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  <span>{initialData ? 'CẬP NHẬT' : 'ĐĂNG BÀI'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal Popup */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-lg font-bold text-slate-800">Xác nhận hủy đăng tin</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Thông tin đăng tin đang được nhập dở dang. Nếu rời đi bây giờ, toàn bộ dữ liệu đã nhập sẽ bị mất. Bạn có chắc chắn muốn hủy đăng tin không?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg uppercase transition-colors cursor-pointer"
              >
                Tiếp tục nhập
              </button>
              <button
                onClick={() => {
                  setIsSuccess(true); 
                  setIsConfirmModalOpen(false);
                  navigate(nextUrl || '/dashboard');
                }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg uppercase transition-colors cursor-pointer shadow-sm"
              >
                Hủy đăng tin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

