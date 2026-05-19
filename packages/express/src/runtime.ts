import express, { type Express } from 'express';
import { CRUDEngine, registerErrorHandler } from './engines/crud-engine.js';
import { RelationshipEngine } from './engines/relationship-engine.js';
import { ValidationEngine } from './engines/validation-engine.js';
import { loadIr } from './utils/ir-loader.js';
import { RouteRegistry } from './utils/route-registry.js';
import { PrismaStore, type PrismaLikeClient } from './utils/prisma-store.js';
import { registerCustomRoutes, scanOverrideMarkers } from './utils/custom-routes.js';
import { pluralize } from './utils/path-utils.js';
import type { IRDocument } from './utils/ir-loader.js';

export interface InitializationResult {
  success: boolean;
  routesCreated: number;
  modelsCreated: number;
  errors: string[];
}

export interface RuntimeOptions {
  irPath?: string;
  customPath?: string;
  prisma?: PrismaLikeClient;
}

export class Runtime {
  readonly registry = new RouteRegistry();
  readonly validationEngine = new ValidationEngine();
  app: Express | null = null;

  constructor(
    private readonly irPath = '.fastbackend/ir.json',
    private readonly customPath = 'src/custom',
    private readonly prismaClient?: PrismaLikeClient,
  ) {}

  async initialize(app?: Express): Promise<InitializationResult> {
    try {
      const ir = loadIr(this.irPath);
      const prisma = this.prismaClient ?? (await PrismaStore.loadFromProject());
      const store = new PrismaStore(prisma);

      this.app = app ?? express();
      this.app.use(express.json());

      scanOverrideMarkers(this.customPath, this.registry);
      this.registerRootRoute(ir);
      this.registerHealthCheck(store);

      for (const entity of ir.entities) {
        this.validationEngine.createSchemas(entity);
      }

      const crudEngine = new CRUDEngine(this.registry, store, this.validationEngine);
      let routesCreated = crudEngine.registerAll(this.app, ir.entities);

      const relationshipEngine = new RelationshipEngine(this.registry, store, ir.relationships);
      routesCreated += relationshipEngine.registerAll(this.app);

      routesCreated += await registerCustomRoutes(this.app, this.customPath, this.registry);

      registerErrorHandler(this.app);

      return {
        success: true,
        routesCreated,
        modelsCreated: ir.entities.length * 3,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        routesCreated: 0,
        modelsCreated: 0,
        errors: [formatRuntimeError(error)],
      };
    }
  }

  private registerRootRoute(ir: IRDocument): void {
    if (!this.app) {
      return;
    }

    this.app.get('/', (_req, res) => {
      res.json({
        name: ir.metadata.projectName,
        adapter: ir.metadata.adapter,
        schemaFormat: ir.metadata.schemaFormat,
        message: 'FastBackend API is running. Use the resource paths below.',
        endpoints: {
          health: '/health',
          resources: ir.entities.map((entity) => `/${pluralize(entity.name)}`),
        },
      });
    });

    this.registry.register('/', ['GET']);
  }

  private registerHealthCheck(store: PrismaStore): void {
    if (!this.app) {
      return;
    }

    this.app.get('/health', async (_req, res) => {
      try {
        await store.ping();
        res.json({ status: 'healthy', database: 'connected' });
      } catch {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
      }
    });

    this.registry.register('/health', ['GET']);
  }

  getRouteSummary(): Record<string, unknown> {
    return this.registry.summary();
  }
}

export async function createApp(options: RuntimeOptions = {}): Promise<Express> {
  const runtime = new Runtime(options.irPath, options.customPath, options.prisma);
  const result = await runtime.initialize();

  if (!result.success) {
    throw new Error(`Failed to initialize runtime: ${result.errors.join(', ')}`);
  }

  return runtime.app as Express;
}

function formatRuntimeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function startServer(options: RuntimeOptions & { port?: number } = {}): Promise<Express> {
  const app = await createApp(options);
  const port = options.port ?? Number(process.env.PORT ?? 3000);

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`FastBackend Express running on http://localhost:${port}`);
      resolve();
    });
  });

  return app;
}
