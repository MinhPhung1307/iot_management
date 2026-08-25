import { CommandStrategy, CommandContext } from '../types/commandStrategy';

export class DefaultStrategy implements CommandStrategy {
  async execute(ctx: CommandContext): Promise<void> {
    // No-op: chỉ gửi MQTT, không update status
  }
}
