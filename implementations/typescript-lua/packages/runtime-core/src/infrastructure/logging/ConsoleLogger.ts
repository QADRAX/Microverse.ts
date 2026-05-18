import type { LoggerPort } from '../../application/ports/LoggerPort';

export class ConsoleLogger implements LoggerPort {
  readonly info = (message: string): void => {
    const g = globalThis as typeof globalThis & {
      console?: { log: (line: string) => void };
    };
    g.console?.log(`[runtime-core] ${message}`);
  };
}
