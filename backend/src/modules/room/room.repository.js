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
					otherCosts: data.otherCosts,
					status: data.status,
					sharedOwner: data.sharedOwner,
					curfew: data.curfew,
					description: data.description,
					createdBy: userId,
					ownerId: owner.id,
					approvalStatus: 'PENDING_APPROVAL', // Mặc định khi tạo mới
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

			// Liên kết RoomFeature bằng tên tiện ích (nếu có)
			if (data.features && data.features.length > 0) {
				for (const featureName of data.features) {
					let feature = await tx.feature.findUnique({
						where: { name: featureName },
					});
					if (!feature) {
						feature = await tx.feature.create({
							data: { name: featureName },
						});
					}
					await tx.roomFeature.upsert({
						where: {
							roomId_featureId: {
								roomId: newRoom.id,
								featureId: feature.id,
							},
						},
						update: {},
						create: {
							roomId: newRoom.id,
							featureId: feature.id,
						},
					});
				}
			}

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
		const where = {
			creator: {
				isBanned: false,
			},
		};

		// Mặc định chỉ lấy bài đã duyệt, trừ khi có filter cụ thể (cho Admin)
		if (filters.approvalStatus) {
			where.approvalStatus = filters.approvalStatus;
		} else {
			where.approvalStatus = 'APPROVED';
		}

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

		if (filters.ownerEmail) {
			where.creator.email = filters.ownerEmail;
		}

		if (filters.userId) {
			// Cho phép người dùng xem bài của chính mình bất kể trạng thái duyệt
			where.createdBy = filters.userId;
			delete where.approvalStatus; 
		}

		if (filters.search) {
			const searchPattern = filters.search.trim();
			if (searchPattern) {
				where.OR = [
					{ title: { contains: searchPattern, mode: 'insensitive' } },
					{ address: { contains: searchPattern, mode: 'insensitive' } },
					{ description: { contains: searchPattern, mode: 'insensitive' } },
				];
			}
		}

		const total = await prisma.room.count({ where });
		const rooms = await prisma.room.findMany({
			where,
			skip,
			take,
			orderBy: { createdAt: 'desc' },
			include: {
				owner: true,
				images: { orderBy: { displayOrder: 'asc' } },
				features: { include: { feature: true } },
				creator: { select: { id: true, userName: true, email: true, avatar: true } },
			},
		});

		return { total, rooms };
	},

	async findById(id) {
		return await prisma.room.findUnique({
			where: { id },
			include: {
				owner: true,
				creator: { select: { id: true, userName: true, email: true, avatar: true } },
				images: { orderBy: { displayOrder: 'asc' } },
				features: { include: { feature: true } },
				revision: true,
			},
		});
	},

	async findRevisionByRoomId(roomId) {
		return await prisma.roomRevision.findUnique({
			where: { roomId },
		});
	},

	async upsertRevision(roomId, userId, payload) {
		return await prisma.roomRevision.upsert({
			where: { roomId },
			create: {
				roomId,
				createdBy: userId,
				payload,
				status: 'PENDING_APPROVAL',
			},
			update: {
				payload,
				status: 'PENDING_APPROVAL',
				rejectionReason: null,
			},
		});
	},

	async deleteRevisionById(id) {
		return await prisma.roomRevision.delete({
			where: { id },
		});
	},

	async deleteRevisionByRoomId(roomId) {
		return await prisma.roomRevision.delete({
			where: { roomId },
		});
	},

	async updateRoom(id, data, shouldResetApproval = false) {
		return await prisma.$transaction(async (tx) => {
			let ownerId = undefined;

			if (data.ownerPhone && data.ownerName) {
				let owner = await tx.owner.findFirst({
					where: { phoneNumber: data.ownerPhone },
				});
				if (!owner) {
					owner = await tx.owner.create({
						data: { userName: data.ownerName, phoneNumber: data.ownerPhone },
					});
				}
				ownerId = owner.id;
			}

			// Cập nhật các tiện ích (features)
			if (data.features && Array.isArray(data.features)) {
				// 1. Xóa các RoomFeature cũ
				await tx.roomFeature.deleteMany({
					where: { roomId: id },
				});

				// 2. Thêm các RoomFeature mới
				for (const featureName of data.features) {
					let feature = await tx.feature.findUnique({
						where: { name: featureName },
					});
					if (!feature) {
						feature = await tx.feature.create({
							data: { name: featureName },
						});
					}
					await tx.roomFeature.create({
						data: {
							roomId: id,
							featureId: feature.id,
						},
					});
				}
			}

			// Đồng bộ ảnh (nếu có gửi lên trong payload sửa)
			// Tránh việc admin duyệt lại mà bị mất ảnh hoặc không cập nhật ảnh mới
			if (data.images && Array.isArray(data.images)) {
				// 1. Xóa ảnh cũ
				await tx.roomImage.deleteMany({
					where: { roomId: id },
				});
				
				// 2. Thêm ảnh mới
				if (data.images.length > 0) {
					const imageRecords = data.images.map((url, index) => ({
						roomId: id,
						imageUrl: url,
						displayOrder: index,
					}));
					await tx.roomImage.createMany({
						data: imageRecords,
					});
				}
			}

			return await tx.room.update({
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
					otherCosts: data.otherCosts,
					status: data.status,
					sharedOwner: data.sharedOwner,
					curfew: data.curfew,
					description: data.description,
					...(ownerId && { ownerId }),
					...(shouldResetApproval && { 
						approvalStatus: 'PENDING_APPROVAL',
						rejectionReason: null 
					}),
				},
			});
		});
	},

	async updateApprovalStatus(id, status, reason = null) {
		return await prisma.room.update({
			where: { id },
			data: { 
				approvalStatus: status,
				rejectionReason: reason 
			},
		});
	},

	async deleteRoom(id) {
		return await prisma.$transaction(async (tx) => {
			const roomImages = await tx.roomImage.findMany({ where: { roomId: id } });
			const paths = roomImages.map((img) => img.storagePath).filter(Boolean);

			const deleted = await tx.room.delete({ where: { id } });

			if (paths.length > 0) {
				await tx.outboxFileDelete.createMany({
					data: paths.map((path) => ({ storagePath: path, status: 'PENDING' })),
				});
			}
			return deleted;
		});
	},

	async addImageToRoom(roomId, imageUrl, displayOrder, storagePath) {
		return await prisma.roomImage.create({
			data: { roomId, imageUrl, displayOrder, storagePath },
		});
	},

	async countImagesByRoomId(roomId) {
		return await prisma.roomImage.count({ where: { roomId } });
	},

	async findImageById(imageId) {
		return await prisma.roomImage.findUnique({ where: { id: imageId } });
	},

	async deleteImageById(imageId) {
		return await prisma.$transaction(async (tx) => {
			const image = await tx.roomImage.findUnique({ where: { id: imageId } });
			if (image) {
				await tx.roomImage.delete({ where: { id: imageId } });
				if (image.storagePath) {
					await tx.outboxFileDelete.create({
						data: { storagePath: image.storagePath, status: 'PENDING' }
					});
				}
			}
			return image;
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
