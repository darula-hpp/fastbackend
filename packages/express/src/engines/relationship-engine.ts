import type { Express, Request, Response, NextFunction } from 'express';
import type { IRRelationship } from '../utils/ir-loader.js';
import type { PrismaStore } from '../utils/prisma-store.js';
import type { RouteRegistry } from '../utils/route-registry.js';
import { pluralize, openApiPathToExpress, toPrismaDelegateKey } from '../utils/path-utils.js';

export class RelationshipEngine {
  constructor(
    private readonly registry: RouteRegistry,
    private readonly store: PrismaStore,
    private readonly relationships: IRRelationship[],
  ) {}

  registerAll(app: Express): number {
    return this.relationships.reduce((count, relationship) => count + this.registerRelationship(app, relationship), 0);
  }

  registerRelationship(app: Express, relationship: IRRelationship): number {
    const source = relationship.sourceEntity;
    const resource = pluralize(source);
    const openApiPath = `/${resource}/{id}/${relationship.name}`;
    const method = 'GET';

    if (this.registry.isOverridden(method, openApiPath)) {
      return 0;
    }

    app.get(openApiPathToExpress(openApiPath), this.createHandler(relationship));
    this.registry.register(openApiPath, [method], { entity: source, relationship: relationship.name });
    return 1;
  }

  private createHandler(relationship: IRRelationship) {
    const sourceDelegate = this.store.getDelegate({ name: relationship.sourceEntity, fields: [] });
    const targetDelegate = this.store.getDelegate({ name: relationship.targetEntity, fields: [] });
    const sourceKey = toPrismaDelegateKey(relationship.sourceEntity);
    const targetKey = toPrismaDelegateKey(relationship.targetEntity);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const id = Number(req.params.id);
        const limit = Number(req.query.limit ?? 20);
        const offset = Number(req.query.offset ?? 0);

        const sourceRecord = await sourceDelegate.findUnique({ where: { id } });
        if (!sourceRecord) {
          res.status(404).json({ detail: `${relationship.sourceEntity} not found` });
          return;
        }

        let related: Record<string, unknown>[] = [];

        switch (relationship.type) {
          case 'one-to-many': {
            const fk = relationship.targetField ?? `${sourceKey}Id`;
            related = await targetDelegate.findMany({
              where: { [fk]: id },
              take: limit,
              skip: offset,
            });
            break;
          }
          case 'many-to-one': {
            const fk = relationship.sourceField ?? `${targetKey}Id`;
            const fkValue = sourceRecord[fk];
            if (fkValue !== undefined && fkValue !== null) {
              const record = await targetDelegate.findUnique({ where: { id: fkValue } });
              related = record ? [record] : [];
            }
            break;
          }
          case 'one-to-one': {
            const fk = relationship.targetField ?? `${sourceKey}Id`;
            const record = await targetDelegate.findUnique({ where: { [fk]: id } });
            related = record ? [record] : [];
            break;
          }
          case 'many-to-many':
            related = await targetDelegate.findMany({ take: limit, skip: offset });
            break;
          default:
            related = [];
        }

        res.json(related);
      } catch (error) {
        next(error);
      }
    };
  }
}
