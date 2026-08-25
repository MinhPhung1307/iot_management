import { CommandStrategy, CommandContext } from '../types/commandStrategy';
import { DeviceStatus } from '../types';
import { serverSocket } from '../websocket/socket';

export class TurnOnStrategy implements CommandStrategy {
  async execute(ctx: CommandContext): Promise<void> {
    await ctx.device.update({ status: DeviceStatus.ONLINE, lastSeen: new Date() });

    serverSocket.emitDeviceUpdate(ctx.device.id, {
      id: ctx.device.id,
      name: ctx.device.name,
      status: DeviceStatus.ONLINE,
      lastSeen: new Date(),
    });
  }
}
