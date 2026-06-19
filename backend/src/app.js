import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/user/users.router.js';
import roomRouter from './modules/room/room.router.js';
import path from 'path';
import { errorHandlerMiddleware } from './common/middleware/errorHandler.Middleware.js';

const app = express();

// --- SECURITY HEADERS ---
app.use(helmet());

// --- CORS ---
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://172.19.80.1:5173,http://127.0.0.1:5173').split(',').map(o => o.trim());
app.use(cors({
	origin: (origin, callback) => {
		// Cho phép non-browser requests (Postman, curl) và các origin trong whitelist
		if (!origin || ALLOWED_ORIGINS.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error(`CORS policy blocked: ${origin}`));
		}
	},
	credentials: true,
}));

// --- RATE LIMITING ---
// Global: 200 req / 15 phút
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
});

// Auth: Chặn brute-force
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.' },
});

app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// --- BODY PARSING ---
app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---
app.get('/api/geocode', async (req, res, next) => {
	const { q } = req.query;
	if (!q) {
		return res.status(400).json({ message: 'Missing query parameter q' });
	}
	try {
		const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=5&countrycodes=vn`, {
			headers: {
				'User-Agent': 'BKMAP-App/1.0',
			},
		});
		if (response.ok) {
			const data = await response.json();
			return res.json(data);
		}
		return res.status(response.status).json({ message: 'Geocoding failed' });
	} catch (error) {
		next(error);
	}
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/rooms', roomRouter);

// Phục vụ thư mục uploads dạng static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- ERROR HANDLER ---
app.use(errorHandlerMiddleware);

export default app;
