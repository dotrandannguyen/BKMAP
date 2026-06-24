import redisClient from '../../config/redis.js';
import logger from '../utils/logger.js';

const CACHE_PREFIX = 'cache:';

/**
 * Get a value from cache
 * @param {string} key
 * @returns {Promise<any>}
 */
export const get = async (key) => {
  try {
    const value = await redisClient.get(`${CACHE_PREFIX}${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Error getting cache for key: ${key}`, error);
    return null;
  }
};

/**
 * Set a value in cache with a TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<void>}
 */
export const set = async (key, value, ttlSeconds) => {
  try {
    const prefixedKey = `${CACHE_PREFIX}${key}`;
    const stringValue = JSON.stringify(value);
    await redisClient.setex(prefixedKey, ttlSeconds, stringValue);
  } catch (error) {
    logger.error(`Error setting cache for key: ${key}`, error);
  }
};

/**
 * Delete a value from cache
 * @param {string} key
 * @returns {Promise<void>}
 */
export const del = async (key) => {
  try {
    await redisClient.del(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    logger.error(`Error deleting cache for key: ${key}`, error);
  }
};

/**
 * Invalidate cache by a pattern
 * @param {string} pattern
 * @returns {Promise<void>}
 */
export const invalidate = async (pattern) => {
  try {
    const stream = redisClient.scanStream({
      match: `${CACHE_PREFIX}${pattern}`,
      count: 100,
    });

    const keys = [];
    stream.on('data', (resultKeys) => {
      // redis returns keys with the prefix, no need to add it again
      keys.push(...resultKeys);
    });

    stream.on('end', () => {
      if (keys.length) {
        const pipeline = redisClient.pipeline();
        pipeline.del(keys);
        pipeline.exec();
      }
    });

  } catch (error) {
    logger.error(`Error invalidating cache for pattern: ${pattern}`, error);
  }
};
