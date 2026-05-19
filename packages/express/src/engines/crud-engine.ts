import type { Express, Request, Response, NextFunction } from 'express';
import type { IREntity } from '../utils/ir-loader.js';
import type { PrismaStore } from '../utils/prisma-store.js';
import type { RouteRegistry } from '../utils/route-registry.js';
import { ValidationEngine, ValidationError } from './validation-engine.js';
import { QueryEngine } from './query-engine.js';
import { pluralize, openApiPathToExpress } from '../utils/path-utils.js';

export class CRUDEngine {
  private readonly queryEngine = new QueryEngine();

  constructor(
    private readonly registry: RouteRegistry,
    private readonly store: PrismaStore,
    private readonly validationEngine: ValidationEngine,
  ) {}

  registerAll(app: Express, entities: IREntity[]): number {
    return entities.reduce((count, entity) => count + this.registerEntity(app, entity), 0);
  }

  registerEntity(app: Express, entity: IREntity): number {
    const resource = pluralize(entity.name);
    const pkField = entity.primaryKey?.[0] ?? 'id';
    const routes: Array<{ method: 'get' | 'post' | 'put' | 'delete'; openApiPath: string; handler: (req: Request, res: Response, next: NextFunction) => Promise<void> }> = [
      {
        method: 'get',
        openApiPath: `/${resource}`,
        handler: this.createListHandler(entity),
      },
      {
        method: 'post',
        openApiPath: `/${resource}`,
        handler: this.createCreateHandler(entity),
      },
      {
        method: 'get',
        openApiPath: `/${resource}/{id}`,
        handler: this.createRetrieveHandler(entity, pkField),
      },
      {
        method: 'put',
        openApiPath: `/${resource}/{id}`,
        handler: this.createUpdateHandler(entity, pkField),
      },
      {
        method: 'delete',
        openApiPath: `/${resource}/{id}`,
        handler: this.createDeleteHandler(entity, pkField),
      },
    ];

    let count = 0;
    for (const route of routes) {
      if (this.registry.isOverridden(route.method.toUpperCase(), route.openApiPath)) {
        continue;
      }

      const expressPath = openApiPathToExpress(route.openApiPath);
      app[route.method](expressPath, route.handler);
      this.registry.register(route.openApiPath, [route.method.toUpperCase()], { entity: entity.name });
      count += 1;
    }

    return count;
  }

  private createListHandler(entity: IREntity) {
    const textFields = entity.fields.filter((field) => field.type.base === 'string').map((field) => field.name);
    const allowedFields = entity.fields.map((field) => field.name);
    const delegate = this.store.getDelegate(entity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const limit = Number(req.query.limit ?? 20);
        const offset = Number(req.query.offset ?? 0);
        const pagination = this.queryEngine.parsePagination(limit, offset);
        const filters = this.queryEngine.parseFilters(req.query as Record<string, unknown>, entity.fields);
        const sortSpec = this.queryEngine.parseSort(typeof req.query.sort === 'string' ? req.query.sort : undefined, allowedFields);
        const search = typeof req.query.q === 'string' ? req.query.q : undefined;

        const items = await delegate.findMany({
          where: this.queryEngine.buildPrismaWhere(filters, search, textFields),
          orderBy: this.queryEngine.buildPrismaOrderBy(sortSpec),
          take: pagination.limit,
          skip: pagination.offset,
        });

        res.json(items);
      } catch (error) {
        next(error);
      }
    };
  }

  private createCreateHandler(entity: IREntity) {
    const delegate = this.store.getDelegate(entity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const payload = this.validationEngine.validatePayload(`${entity.name}Create`, req.body);
        const created = await delegate.create({ data: payload });
        res.status(201).json(created);
      } catch (error) {
        next(error);
      }
    };
  }

  private createRetrieveHandler(entity: IREntity, pkField: string) {
    const delegate = this.store.getDelegate(entity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = this.parseId(req.params.id);
        const record = await delegate.findUnique({ where: { [pkField]: id } });
        if (!record) {
          res.status(404).json({ detail: `${entity.name} not found` });
          return;
        }
        res.json(record);
      } catch (error) {
        next(error);
      }
    };
  }

  private createUpdateHandler(entity: IREntity, pkField: string) {
    const delegate = this.store.getDelegate(entity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = this.parseId(req.params.id);
        const payload = this.validationEngine.validatePayload(`${entity.name}Update`, req.body, true);
        const updated = await delegate.update({
          where: { [pkField]: id },
          data: payload,
        });
        res.json(updated);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Record to update not found')) {
          res.status(404).json({ detail: `${entity.name} not found` });
          return;
        }
        next(error);
      }
    };
  }

  private createDeleteHandler(entity: IREntity, pkField: string) {
    const delegate = this.store.getDelegate(entity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = this.parseId(req.params.id);
        await delegate.delete({ where: { [pkField]: id } });
        res.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
          res.status(404).json({ detail: `${entity.name} not found` });
          return;
        }
        next(error);
      }
    };
  }

  private parseId(raw: string | string[] | undefined): number {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const id = Number(value);
    if (Number.isNaN(id)) {
      throw new ValidationError('Invalid id parameter');
    }
    return id;
  }
}

export function registerErrorHandler(app: Express): void {
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (error instanceof ValidationError) {
      res.status(422).json({ detail: error.details ?? error.message });
      return;
    }

    next(error);
  });
}
