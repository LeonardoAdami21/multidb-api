// src/modules/graphql-engine/graphql-engine.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { GraphqlEngineRepository } from './repository/graphql-engine.repository';

@Injectable()
export class GraphqlEngineService {
  constructor(private graphqlEngineRepository: GraphqlEngineRepository) {}

  async buildSchemaSDL(tenantId: string, databaseId: string): Promise<string> {
    const schema = await this.graphqlEngineRepository.buildSchemaSDL(
      tenantId,
      databaseId,
    );
    return schema;
  }
}
