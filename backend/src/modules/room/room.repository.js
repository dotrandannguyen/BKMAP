import prisma from '../../config/database.js';

export const roomRepository = {
	async createRoom(data, userId) {
		return await prisma.$transaction(async (tx) => {
			// 1. Kiểm tra hoặc tạo Owner bằng số điện thoại
			let owner = await tx.owner.findFirst({
				where: { phoneNumber: data.ownerPhone },
			});

			if (!owner) {
				owner = await tx.owner.create({
					data: {
						userName: data.ownerName,
						phoneNumber: data.ownerPhone,
					},
				});
			}

			// 2. Tạo Room
			const newRoom = await tx.room.create({
				data: {
					title: data.title,
					address: data.address,
					street: data.street,
					ward: data.ward,
					latitude: data.latitude,
					longitude: data.longitude,
					distanceToBk: data.distanceToBk,
					price: data.price,
					area: data.area,
					electricityPrice: data.electricityPrice,
					waterPrice: data.waterPrice,
					status: data.status,
					sharedOwner: data.sharedOwner,
					curfew: data.curfew,
					description: data.description,
					createdBy: userId,
					ownerId: owner.id,
				},
			});

			// 3. Tạo RoomImage (nếu có)
			if (data.imageUrls && data.imageUrls.length > 0) {
				const imageRecords = data.imageUrls.map((url, index) => ({
					roomId: newRoom.id,
					imageUrl: url,
					displayOrder: index,
				}));

				await tx.roomImage.createMany({
					data: imageRecords,
				});
			}

			// 4. Liên kết RoomFeature (nếu có)
			if (data.featureIds && data.featureIds.length > 0) {
				const featureRecords = data.featureIds.map((featureId) => ({
					roomId: newRoom.id,
					featureId: featureId,
				}));

				await tx.roomFeature.createMany({
					data: featureRecords,
				});
			}

			// Trả về Room đã được lấy kèm các bảng liên kết
			return await tx.room.findUnique({
				where: { id: newRoom.id },
				include: {
					owner: true,
					images: true,
					features: {
						include: {
							feature: true,
						},
					},
				},
			});
		});
	},
	async findAll(filters = {}, skip = 0, take = 10) {
		const where = {};

		if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
			where.price = {};
			if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
			if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
		}

		if (filters.minArea !== undefined || filters.maxArea !== undefined) {
			where.area = {};
			if (filters.minArea !== undefined) where.area.gte = filters.minArea;
			if (filters.maxArea !== undefined) where.area.lte = filters.maxArea;
		}

		if (filters.distanceToBk !== undefined) {
			where.distanceToBk = { lte: filters.distanceToBk };
		}

		if (filters.status) {
			where.status = filters.status;
		}

		if (filters.ward) {
			where.ward = { contains: filters.ward, mode: 'insensitive' };
		}

		// Tính tổng số lượng
		const total = await prisma.room.count({ where });

		const rooms = await prisma.room.findMany({
			where,
			skip,
			take,
			orderBy: { createdAt: 'desc' },
			include: {
				images: {
					orderBy: { displayOrder: 'asc' },
				},
				features: {
					include: { feature: true },
				},
			},
		});

		return { total, rooms };
	},

	async findById(id) {
		return await prisma.room.findUnique({
			where: { id },
			include: {
				owner: true,
				creator: {
					select: { id: true, userName: true, email: true },
				},
				images: {
					orderBy: { displayOrder: 'asc' },
				},
				features: {
					include: { feature: true },
				},
			},
		});
	},

	async updateRoom(id, data) {
		return await prisma.$transaction(async (tx) => {
			let ownerId = undefined;

			// NẾU cập nhật thông tin chủ trọ
			if (data.ownerPhone && data.ownerName) {
				let owner = await tx.owner.findFirst({
					where: { phoneNumber: data.ownerPhone },
				});

				if (!owner) {
					owner = await tx.owner.create({
						data: {
							userName: data.ownerName,
							phoneNumber: data.ownerPhone,
						},
					});
				}
				ownerId = owner.id;
			}

			// Cập nhật thông tin phòng
			const updatedRoom = await tx.room.update({
				where: { id },
				data: {
					title: data.title,
					address: data.address,
					street: data.street,
					ward: data.ward,
					latitude: data.latitude,
					longitude: data.longitude,
					distanceToBk: data.distanceToBk,
					price: data.price,
					area: data.area,
					electricityPrice: data.electricityPrice,
					waterPrice: data.waterPrice,
					status: data.status,
					sharedOwner: data.sharedOwner,
					curfew: data.curfew,
					description: data.description,
					...(ownerId && { ownerId }), // Chỉ update ownerId nếu có
				},
			});

			// Xử lý cập nhật ảnh (Diff-based: chỉ xóa ảnh bị loại bỏ, giữ nguyên ảnh còn lại)
			if (data.imageUrls) {
				const oldImages = await tx.roomImage.findMany({ where: { roomId: id } });
				const newUrlSet = new Set(data.imageUrls);
				const oldUrlSet = new Set(oldImages.map((img) => img.imageUrl));

				// Tìm ảnh cũ cần xóa (không nằm trong danh sách mới)
				const imagesToDelete = oldImages.filter((img) => !newUrlSet.has(img.imageUrl));
				const pathsToDelete = imagesToDelete.map((img) => img.storagePath).filter(Boolean);

				if (imagesToDelete.length > 0) {
					await tx.roomImage.deleteMany({
						where: { id: { in: imagesToDelete.map((img) => img.id) } },
					});

					if (pathsToDelete.length > 0) {
						await tx.outboxFileDelete.createMany({
							data: pathsToDelete.map((path) => ({ storagePath: path, status: 'PENDING' })),
						});
					}
				}

				// Cập nhật displayOrder cho ảnh được giữ lại theo thứ tự mới
				for (let i = 0; i < data.imageUrls.length; i++) {
					const url = data.imageUrls[i];
					if (oldUrlSet.has(url)) {
						const existingImg = oldImages.find((img) => img.imageUrl === url);
						if (existingImg && existingImg.displayOrder !== i) {
							await tx.roomImage.update({
								where: { id: existingImg.id },
								data: { displayOrder: i },
							});
						}
					} else {
						// Ảnh hoàn toàn mới (URL chưa tồn tại) — tạo record mới
						await tx.roomImage.create({
							data: { roomId: id, imageUrl: url, displayOrder: i },
						});
					}
				}
			}

			// Xử lý cập nhật Tiện ích (Xóa hết liên kết cũ, thêm liên kết mới)
			if (data.featureIds) {
				await tx.roomFeature.deleteMany({ where: { roomId: id } });
				if (data.featureIds.length > 0) {
					const featureRecords = data.featureIds.map((featureId) => ({
						roomId: id,
						featureId: featureId,
					}));
					await tx.roomFeature.createMany({ data: featureRecords });
				}
			}

			return updatedRoom; // Hoặc query lại include
		});
	},

	async deleteRoom(id) {
		return await prisma.$transaction(async (tx) => {
			const roomImages = await tx.roomImage.findMany({ where: { roomId: id } });
			const paths = roomImages.map((img) => img.storagePath).filter(Boolean);

			// Do đã config onDelete: Cascade trong schema, việc xóa Room sẽ tự động xóa RoomImage và RoomFeature liên quan
			const deletedRoom = await tx.room.delete({
				where: { id },
			});

			if (paths.length > 0) {
				await tx.outboxFileDelete.createMany({
					data: paths.map((path) => ({ storagePath: path, status: 'PENDING' })),
				});
			}

			return deletedRoom;
		});
	},


	async addImageToRoom(roomId, imageUrl, displayOrder, storagePath) {
		return await prisma.roomImage.create({
			data: {
				roomId,
				imageUrl,
				displayOrder,
				storagePath,
			},
		});
	},

	async countImagesByRoomId(roomId) {
		return await prisma.roomImage.count({
			where: { roomId },
		});
	},

	async findImageById(imageId) {
		return await prisma.roomImage.findUnique({
			where: { id: imageId },
		});
	},

	async deleteImageById(imageId) {
		return await prisma.$transaction(async (tx) => {
			const image = await tx.roomImage.findUnique({ where: { id: imageId } });

			const deletedImage = await tx.roomImage.delete({
				where: { id: imageId },
			});

			if (image && image.storagePath) {
				await tx.outboxFileDelete.create({
					data: { storagePath: image.storagePath, status: 'PENDING' },
				});
			}

			return deletedImage;
		});
	},

	async updateImagesOrder(imagesData) {
		return await prisma.$transaction(
			imagesData.map((img) =>
				prisma.roomImage.update({
					where: { id: img.id },
					data: { displayOrder: img.displayOrder },
				})
			)
		);
	},

};
