import { spawn } from 'node:child_process';
import { SubprocessError } from '../errors/index.js';
import type { ValidationResult } from '../ir/types.js';

export interface SpawnOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface SubprocessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  data?: unknown;
}

export class SubprocessRunner {
  async spawn(
    command: string,
    args: string[],
    options: SpawnOptions = {},
  ): Promise<SubprocessResult> {
    const { cwd, timeout = 30000, env } = options;

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeout);

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(
          new SubprocessError(`${command} ${args.join(' ')}`, -1, error.message, stdout),
        );
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);

        if (timedOut) {
          reject(
            new SubprocessError(
              `${command} ${args.join(' ')}`,
              -1,
              `Process timed out after ${timeout}ms`,
              stdout,
            ),
          );
          return;
        }

        const code = exitCode ?? 1;
        const result: SubprocessResult = {
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
        };

        if (code !== 0) {
          reject(
            new SubprocessError(
              `${command} ${args.join(' ')}`,
              code,
              stderr.trim() || `Process exited with code ${code}`,
              stdout.trim(),
            ),
          );
          return;
        }

        resolve(result);
      });
    });
  }

  validateOutput(output: string): ValidationResult {
    if (!output) {
      return { valid: false, errors: ['Subprocess output is empty'] };
    }

    try {
      const data = JSON.parse(output);
      const errors: string[] = [];

      if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Output must be a JSON object'] };
      }

      if (!Array.isArray(data.entities)) {
        errors.push('entities must be an array');
      }

      if (!Array.isArray(data.relationships)) {
        errors.push('relationships must be an array');
      }

      return { valid: errors.length === 0, errors };
    } catch {
      return { valid: false, errors: ['Output is not valid JSON'] };
    }
  }

  async spawnAndParse(
    command: string,
    args: string[],
    options: SpawnOptions = {},
  ): Promise<SubprocessResult> {
    const result = await this.spawn(command, args, options);
    const validation = this.validateOutput(result.stdout);

    if (!validation.valid) {
      throw new SubprocessError(
        `${command} ${args.join(' ')}`,
        result.exitCode,
        validation.errors.join('; '),
        result.stdout,
      );
    }

    result.data = JSON.parse(result.stdout);
    return result;
  }
}
