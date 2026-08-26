jest.mock('../../config/redis', () => {
  const eventEmitter = require('events');
  const sub = new eventEmitter();
  sub.subscribe = jest.fn();
  sub.unsubscribe = jest.fn();
  sub.quit = jest.fn().mockResolvedValue(undefined);

  const pub = { publish: jest.fn(), quit: jest.fn().mockResolvedValue(undefined) };

  return { __esModule: true, redisPub: pub, redisSub: sub };
});

import { redisPub, redisSub } from '../../config/redis';
import PubSubService, { PubSubChannels } from '../../services/pubsub.service';

const mockPub = redisPub as jest.Mocked<typeof redisPub>;
const mockSub = redisSub as jest.Mocked<typeof redisSub>;

describe('PubSubService', () => {
  let service: PubSubService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PubSubService();
  });

  describe('publish', () => {
    it('should publish JSON-serialized message to redisPub', () => {
      const data = { id: 1, status: 'online' };
      service.publish('test:channel', data);

      expect(mockPub.publish).toHaveBeenCalledWith('test:channel', JSON.stringify(data));
    });

    it('should handle nested objects', () => {
      const data = { device: { id: 1, meta: { temp: 25.5 } } };
      service.publish('test:channel', data);

      expect(mockPub.publish).toHaveBeenCalledWith('test:channel', JSON.stringify(data));
    });
  });

  describe('subscribe', () => {
    it('should subscribe to redisSub on first handler for a channel', () => {
      const handler = jest.fn();
      service.subscribe('test:channel', handler);

      expect(mockSub.subscribe).toHaveBeenCalledWith('test:channel');
    });

    it('should not subscribe again for additional handlers on same channel', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      service.subscribe('test:channel', handler1);
      service.subscribe('test:channel', handler2);

      expect(mockSub.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should call handler when message is received', () => {
      const handler = jest.fn();
      service.subscribe('test:channel', handler);

      const message = JSON.stringify({ id: 1 });
      (mockSub as any).emit('message', 'test:channel', message);

      expect(handler).toHaveBeenCalledWith({ id: 1 });
    });

    it('should call multiple handlers on same channel', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      service.subscribe('test:channel', handler1);
      service.subscribe('test:channel', handler2);

      const message = JSON.stringify({ id: 1 });
      (mockSub as any).emit('message', 'test:channel', message);

      expect(handler1).toHaveBeenCalledWith({ id: 1 });
      expect(handler2).toHaveBeenCalledWith({ id: 1 });
    });

    it('should not call handler for different channel', () => {
      const handler = jest.fn();
      service.subscribe('channel:a', handler);

      const message = JSON.stringify({ id: 1 });
      (mockSub as any).emit('message', 'channel:b', message);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', () => {
      const handler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      service.subscribe('test:channel', handler);

      (mockSub as any).emit('message', 'test:channel', 'invalid-json');

      expect(handler).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribe', () => {
    it('should remove handler and unsubscribe from redisSub when last handler removed', () => {
      const handler = jest.fn();
      service.subscribe('test:channel', handler);
      service.unsubscribe('test:channel', handler);

      expect(mockSub.unsubscribe).toHaveBeenCalledWith('test:channel');
    });

    it('should not unsubscribe from redisSub if other handlers remain', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      service.subscribe('test:channel', handler1);
      service.subscribe('test:channel', handler2);
      service.unsubscribe('test:channel', handler1);

      expect(mockSub.unsubscribe).not.toHaveBeenCalled();
    });

    it('should not error when unsubscribing from non-existent channel', () => {
      const handler = jest.fn();
      expect(() => service.unsubscribe('nonexistent', handler)).not.toThrow();
    });

    it('should not error when unsubscribing handler that was not registered', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      service.subscribe('test:channel', handler1);

      expect(() => service.unsubscribe('test:channel', handler2)).not.toThrow();
      expect(mockSub.unsubscribe).not.toHaveBeenCalled();
    });

    it('should stop calling removed handler on new messages', () => {
      const handler = jest.fn();
      service.subscribe('test:channel', handler);
      service.unsubscribe('test:channel', handler);

      (mockSub as any).emit('message', 'test:channel', JSON.stringify({ id: 1 }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should clear subscriptions and quit both redis clients', async () => {
      const handler = jest.fn();
      service.subscribe('test:channel', handler);

      await service.disconnect();

      expect(mockPub.quit).toHaveBeenCalled();
      expect(mockSub.quit).toHaveBeenCalled();
    });
  });

  describe('PubSubChannels', () => {
    it('should define expected channels', () => {
      expect(PubSubChannels.DEVICE_UPDATE).toBe('iot:device:update');
      expect(PubSubChannels.DEVICE_DATA).toBe('iot:device:data');
      expect(PubSubChannels.DEVICE_ALERT).toBe('iot:device:alert');
    });
  });
});
