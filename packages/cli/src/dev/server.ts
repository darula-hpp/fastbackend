import { spawn, type ChildProcess } from 'node:child_process';
import { logger } from '../utils/logger.js';

export interface ServerOptions {
  cwd: string;
  port: number;
  hotReload: boolean;
}

export function startFastApiServer(options: ServerOptions): Promise<ChildProcess> {
  const { cwd, port, hotReload } = options;

  const args = hotReload
    ? ['-m', 'uvicorn', 'main:app', '--reload', '--port', String(port)]
    : ['-m', 'uvicorn', 'main:app', '--port', String(port)];

  return new Promise((resolvePromise, reject) => {
    const child = spawn('python3', args, { cwd, stdio: 'inherit' });

    child.on('error', (err) => {
      logger.error(`Failed to start server: ${err.message}`);
      logger.info('Make sure Python 3 and uvicorn are installed');
      reject(err);
    });

    child.on('spawn', () => {
      resolvePromise(child);
    });

    child.on('close', (code) => {
      process.exit(code ?? 0);
    });
  });
}
