import { HttpResponse } from '../../common/dtos/index.js';
import { favoriteService } from './favorite.service.js';

export const favoriteController = {
	async getFavorites(req, res, next) {
		try {
			const data = await favoriteService.getFavorites(req.user.id);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},

	async addFavorite(req, res, next) {
		try {
			const data = await favoriteService.addFavorite(req.user.id, req.body.roomId);
			return new HttpResponse(res).created(data);
		} catch (error) {
			next(error);
		}
	},

	async removeFavorite(req, res, next) {
		try {
			const data = await favoriteService.removeFavorite(req.user.id, req.params.roomId);
			return new HttpResponse(res).success(data);
		} catch (error) {
			next(error);
		}
	},
};
