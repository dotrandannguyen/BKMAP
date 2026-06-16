import express from 'express';
import multer from 'multer';
import { supabase } from '../../config/supabase.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { HttpResponse } from '../../common/dtos/index.js';

const router = express.Router();

// Sử dụng memoryStorage để xử lý bằng sharp trước khi đưa lên Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Xử lý POST /api/upload (Upload độc lập - trả về link)
router.post('/', upload.array('images', 10), async (req, res, next) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
		}

		const urls = [];

		for (const file of req.files) {
			// Resize & Convert sang webp
			const processedImageBuffer = await sharp(file.buffer)
				.resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();

			// Tên file ngẫu nhiên đưa vào thư mục chung `temp` hoặc `rooms`
			const fileName = `temp/${uuidv4()}.webp`;

			const { data, error } = await supabase.storage
				.from('BKMAP-images')
				.upload(fileName, processedImageBuffer, {
					contentType: 'image/webp',
					upsert: true,
				});

			if (error) {
				throw new Error(`Upload ảnh lên Supabase thất bại: ${error.message}`);
			}

			// Lấy URL public
			const { data: publicUrlData } = supabase.storage
				.from('BKMAP-images')
				.getPublicUrl(data.path);

			urls.push(publicUrlData.publicUrl);
		}

		return new HttpResponse(res).success({ urls });
	} catch (error) {
		next(error);
	}
});

export default router;
