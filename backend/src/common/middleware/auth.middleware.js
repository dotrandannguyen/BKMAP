import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../exceptions/index.js';

const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET;

export const authMiddleware = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException('Authentication required');
		}

		const token = authHeader.split(' ')[1];

		// Verify token
		const payload = jwt.verify(token, ACCESS_JWT_SECRET);

		// Attach user info to request
		req.user = { id: payload.sub, role: payload.role };

		next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			next(new UnauthorizedException('Access token expired'));
		} else {
			next(new UnauthorizedException('Invalid access token'));
		}
	}
};

// MỚI: Middleware tùy chọn - Nếu có token thì lấy user, nếu không thì vẫn cho qua (cho Guest)
export const optionalAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.split(' ')[1];
			const payload = jwt.verify(token, ACCESS_JWT_SECRET);
			req.user = { id: payload.sub, role: payload.role };
		}
		next();
	} catch (error) {
		// Nếu token sai hoặc hết hạn cũng cho qua như Guest, hoặc có thể chọn xóa req.user
		next();
	}
};
