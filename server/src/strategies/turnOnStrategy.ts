import { CommandStrategy, CommandContext } from '../types/commandStrategy';
import { DeviceStatus } from '../types';
import { PubSubChannels } from '../services/pubsub.service';

export class TurnOnStrategy implements CommandStrategy {
  async execute(ctx: CommandContext): Promise<void> {
    await ctx.device.update({ status: DeviceStatus.ONLINE, lastSeen: new Date() });

    ctx.pubsub.publish(PubSubChannels.DEVICE_UPDATE, {
      id: ctx.device.id,
      name: ctx.device.name,
      status: DeviceStatus.ONLINE,
      lastSeen: new Date(),
    });
  }
}
