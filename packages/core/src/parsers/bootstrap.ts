import { pluginRegistry } from './plugin-interface.js';
import { sqlalchemyPlugin } from './sqlalchemy/plugin.js';
import { prismaPlugin } from './prisma/plugin.js';

let bootstrapped = false;

export function bootstrapParsers(): void {
  if (bootstrapped) {
    return;
  }

  pluginRegistry.register(sqlalchemyPlugin);
  pluginRegistry.register(prismaPlugin);
  bootstrapped = true;
}
