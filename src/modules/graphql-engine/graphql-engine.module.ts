import { Module } from '@nestjs/common';
import { GraphqlEngineService } from './graphql-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseModule } from '../database/database.module';
import { GraphqlEngineRepository } from './repository/graphql-engine.repository';

@Module({
  imports: [PrismaModule, DatabaseModule],
  providers: [GraphqlEngineService, GraphqlEngineRepository],
  exports: [GraphqlEngineService],
})
export class GraphqlEngineModule {}
