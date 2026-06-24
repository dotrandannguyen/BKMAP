// backend/src/config/__mocks__/redis.js
import { jest } from '@jest/globals';

const mockRedisStore = new Map();

const redisMock = {
    get: jest.fn(key => {
        const value = mockRedisStore.get(key);
        return Promise.resolve(value ? value : null);
    }),
    set: jest.fn((key, value, ...args) => {
        mockRedisStore.set(key, value);
        return Promise.resolve('OK');
    }),
    del: jest.fn(key => {
        mockRedisStore.delete(key);
        return Promise.resolve(1);
    }),
    scanStream: jest.fn(({ match }) => {
            const EventEmitter = require('events');
            const emitter = new EventEmitter();

            const patternString = match.replace(/\*/g, '.*');
            const pattern = new RegExp(`^${patternString}$`);

            const matchingKeys = [];
            for (const key of mockRedisStore.keys()) {
                if (pattern.test(key)) {
                    matchingKeys.push(key);
                }
            }

            // Use process.nextTick to simulate async behavior
            process.nextTick(() => {
                if (matchingKeys.length > 0) {
                    emitter.emit('data', matchingKeys);
                }
                emitter.emit('end');
            });

            return emitter;
        }),
    pipeline: jest.fn(() => ({
        del: jest.fn(),
        exec: jest.fn(() => {
            // A more sophisticated mock could track the pipelined commands
            return Promise.resolve([]);
        }),
    })),
    // Utility to clear the store for tests
    __clear: () => {
        mockRedisStore.clear();
    },
    // Utility to inspect the store
    __getStore: () => mockRedisStore,
};

export default redisMock;
