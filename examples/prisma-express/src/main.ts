import { startServer } from '@fastbackend/express';

const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : undefined;

startServer({ port }).catch((error) => {
  console.error(error);
  process.exit(1);
});
