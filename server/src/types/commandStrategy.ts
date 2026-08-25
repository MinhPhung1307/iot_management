import { Device } from '../models/Device';

export interface CommandContext {
  device: Device;
  params?: Record<string, any>;
}

export interface CommandStrategy {
  execute(ctx: CommandContext): Promise<void>;
}
