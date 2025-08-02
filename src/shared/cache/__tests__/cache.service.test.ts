import { RedisCacheService } from '../cache.service';

const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
};

describe('RedisCacheService', () => {
    const service = new RedisCacheService(true, redisMock as any);

    it('should get from cache', async () => {
        redisMock.get.mockResolvedValueOnce(JSON.stringify('test'));
        const result = await service.get('key');
        expect(result).toBe('test');
    });

    it('should set to cache', async () => {
        await service.set('key', 'value');
        expect(redisMock.set).toHaveBeenCalled();
    });

    it('should delete from cache', async () => {
        await service.del('key');
        expect(redisMock.del).toHaveBeenCalledWith('key');
    });

    it('should return null if disabled on get', async () => {
        const disabledService = new RedisCacheService(false, redisMock as any);
        const result = await disabledService.get('key');
        expect(result).toBeNull();
    });

    it('should not call set if disabled', async () => {
        const disabledService = new RedisCacheService(false, redisMock as any);
        await disabledService.set('key', 'value');
        expect(redisMock.set).not.toHaveBeenCalled();
    });

    it('should not call del if disabled', async () => {
        const disabledService = new RedisCacheService(false, redisMock as any);
        await disabledService.del('key');
        expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('should call set with EX and ttl when ttl is provided', async () => {
        await service.set('key', 'value', 60);
        expect(redisMock.set).toHaveBeenCalledWith('key', JSON.stringify('value'), 'EX', 60);
    });
});
