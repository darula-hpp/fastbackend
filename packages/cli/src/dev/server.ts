import { spawn, type ChildProcess } from 'node:child_process';
import { getRuntimeAdapter } from '@fastbackend/core';
import { logger } from '../utils/logger.js';
import type { DevServerOptions } from '@fastbackend/core';

export function startAdapterServer(adapterName: string, options: DevServerOptions): Promise<ChildProcess> {
  const adapter = getRuntimeAdapter(adapterName);
  const { command, args } = adapter.getDevCommand(options);

  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: 'inherit', env: process.env });

    child.on('error', (err) => {
      logger.error(`Failed to start server: ${err.message}`);
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

/** @deprecated Use startAdapterServer('fastapi', options) */
export function startFastApiServer(options: DevServerOptions): Promise<ChildProcess> {
  return startAdapterServer('fastapi', options);
}

export function startExpressServer(options: DevServerOptions): Promise<ChildProcess> {
  return startAdapterServer('express', options);
}
