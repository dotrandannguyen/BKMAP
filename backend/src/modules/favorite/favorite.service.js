import { validate as uuidValidate } from 'uuid';
import { ClientException } from '../../common/exceptions/index.js';
import { favoriteRepository } from './favorite.repository.js';

export const favoriteService = {
	async getFavorites(userId) {
		const favorites = await favoriteRepository.findByUserId(userId);
		return {
			ids: favorites.map((favorite) => favorite.roomId),
			rooms: favorites.map((favorite) => favorite.room),
		};
	},

	async addFavorite(userId, roomId) {
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phong tro khong hop le.');
		}

		const room = await favoriteRepository.findRoomById(roomId);
		if (!room) {
			throw new ClientException(404, 'Khong tim thay phong tro.');
		}

		const favorite = await favoriteRepository.upsert(userId, roomId);
		return {
			message: 'Da luu phong vao danh sach yeu thich.',
			id: favorite.roomId,
			room: favorite.room,
		};
	},

	async removeFavorite(userId, roomId) {
		if (!uuidValidate(roomId)) {
			throw new ClientException(400, 'ID phong tro khong hop le.');
		}

		await favoriteRepository.delete(userId, roomId);
		return {
			message: 'Da xoa phong khoi danh sach yeu thich.',
			id: roomId,
		};
	},
};
