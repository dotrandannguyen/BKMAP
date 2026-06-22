import { z } from 'zod';

export const favoriteRoomBodySchema = {
	body: z.object({
		roomId: z.string().uuid('ID phong tro khong hop le'),
	}),
};

export const favoriteRoomParamsSchema = {
	params: z.object({
		roomId: z.string().uuid('ID phong tro khong hop le'),
	}),
};
