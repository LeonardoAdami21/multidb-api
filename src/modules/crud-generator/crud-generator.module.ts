import { Module } from '@nestjs/common';
import { QueryEngineModule } from '../query-engine/query-engine.module';

@Module({
  imports: [QueryEngineModule],
  exports: [],
})
export class CrudGeneratorModule {}
