import { Device } from '../models/Device';
import PubSubService from '../services/pubsub.service';

export interface CommandContext {
  device: Device;
  params?: Record<string, any>;
  pubsub: PubSubService;
}

export interface CommandStrategy {
  execute(ctx: CommandContext): Promise<void>;
}
