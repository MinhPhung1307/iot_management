import { CommandStrategy } from '../types/commandStrategy';
import { TurnOnStrategy } from './turnOnStrategy';
import { TurnOffStrategy } from './turnOffStrategy';
import { DefaultStrategy } from './defaultStrategy';

const strategies: Record<string, CommandStrategy> = {
  turn_on: new TurnOnStrategy(),
  turn_off: new TurnOffStrategy(),
};

const defaultStrategy = new DefaultStrategy();

export const getCommandStrategy = (command: string): CommandStrategy => {
  return strategies[command] || defaultStrategy;
};
