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