import { redisPub, redisSub } from '../config/redis';

export const PubSubChannels = {
  DEVICE_UPDATE: 'iot:device:update',
  DEVICE_DATA: 'iot:device:data',
  DEVICE_ALERT: 'iot:device:alert',
} as const;

type MessageHandler = (data: any) => void;

class PubSubService {
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();

  constructor() {
    redisSub.on('message', (channel: string, message: string) => {
      const handlers = this.subscriptions.get(channel);
      if (!handlers) return;

      try {
        const data = JSON.parse(message);
        handlers.forEach((handler) => handler(data));
      } catch (err) {
        console.error(`PubSub: failed to parse message on channel ${channel}:`, err);
      }
    });
  }

  publish(channel: string, data: any): void {
    const payload = JSON.stringify(data);
    redisPub.publish(channel, payload);
  }

  subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      // First subscriber to this channel — tell Redis
      redisSub.subscribe(channel);
    }
    this.subscriptions.get(channel)!.add(handler);
  }

  unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(channel);
    if (!handlers) return;

    handlers.delete(handler);

    // Last handler removed — unsubscribe from Redis
    if (handlers.size === 0) {
      this.subscriptions.delete(channel);
      redisSub.unsubscribe(channel);
    }
  }

  async disconnect(): Promise<void> {
    this.subscriptions.clear();
    await Promise.all([
      redisPub.quit(),
      redisSub.quit(),
    ]);
  }
}

export default PubSubService;

// Singleton instance — importable by any module
export const pubsub = new PubSubService();
