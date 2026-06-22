import express from 'express';
import { favoriteController } from './favorite.controller.js';
import { favoriteRoomBodySchema, favoriteRoomParamsSchema } from './dto/requests/favorite.request.js';
import { validateRequestMiddleware } from '../../common/middleware/index.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, favoriteController.getFavorites);

router.post(
	'/',
	authMiddleware,
	validateRequestMiddleware(favoriteRoomBodySchema),
	favoriteController.addFavorite
);

router.delete(
	'/:roomId',
	authMiddleware,
	validateRequestMiddleware(favoriteRoomParamsSchema),
	favoriteController.removeFavorite
);

export default router;
