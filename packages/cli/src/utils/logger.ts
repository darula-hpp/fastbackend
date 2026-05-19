export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class Logger {
  private level: LogLevel = 'info';
  private debugEnabled = false;

  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (enabled) this.level = 'debug';
  }

  error(message: string, context?: unknown): void {
    console.error(`\x1b[31m✖ ${message}\x1b[0m`);
    if (context) console.error(context);
  }

  warn(message: string, context?: unknown): void {
    console.warn(`\x1b[33m⚠ ${message}\x1b[0m`);
    if (context) console.warn(context);
  }

  info(message: string): void {
    console.log(`\x1b[36mℹ ${message}\x1b[0m`);
  }

  success(message: string): void {
    console.log(`\x1b[32m✔ ${message}\x1b[0m`);
  }

  debug(message: string, context?: unknown): void {
    if (!this.debugEnabled) return;
    console.log(`\x1b[90m… ${message}\x1b[0m`);
    if (context) console.log(context);
  }
}

export const logger = new Logger();
