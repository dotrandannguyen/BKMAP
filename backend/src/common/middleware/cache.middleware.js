import * as cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

// --- Monkey-patching res.json ---
const patchResponse = (res, key, ttl) => {
    const originalJson = res.json;
    res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheService.set(key, data, ttl).catch(err => {
                logger.error(`Failed to cache response for key: ${key}`, err);
            });
        }
        return originalJson.apply(res, arguments);
    };
};

export const cacheGuestRooms = async (req, res, next) => {
    // Bypass cache if user is logged in
    if (req.headers.authorization) {
        return next();
    }

    // Bypass cache if there are any query params other than page/limit defaults
    const queryKeys = Object.keys(req.query);
    const allowedKeys = ['page', 'limit'];
    const isDefaultQuery = queryKeys.length === 0 || 
                           (queryKeys.every(key => allowedKeys.includes(key)) &&
                           (req.query.page ? req.query.page === '1' : true) &&
                           (req.query.limit ? req.query.limit === '10' : true));

    if (!isDefaultQuery) {
        return next();
    }

    const key = `rooms:home:page_1_limit_10`;
    try {
        const cachedData = await cacheService.get(key);
        if (cachedData) {
            logger.info(`Cache HIT for key: ${key}`);
            return res.status(200).json(cachedData);
        }

        logger.info(`Cache MISS for key: ${key}`);
        patchResponse(res, key, 3 * 60); // 3 minutes TTL
        next();
    } catch (error) {
        logger.error(`Cache middleware error for key: ${key}`, error);
        next();
    }
};

export const cacheRoomDetail = async (req, res, next) => {
    // Bypass cache if user is logged in
    if (req.headers.authorization) {
        return next();
    }

    const { id } = req.params;
    if (!id) {
        return next();
    }

    const key = `room_detail:${id}`;
    try {
        const cachedData = await cacheService.get(key);
        if (cachedData) {
            logger.info(`Cache HIT for key: ${key}`);
            return res.status(200).json(cachedData);
        }

        logger.info(`Cache MISS for key: ${key}`);
        patchResponse(res, key, 30 * 60); // 30 minutes TTL
        next();
    } catch (error) {
        logger.error(`Cache middleware error for key: ${key}`, error);
        next();
    }
};
