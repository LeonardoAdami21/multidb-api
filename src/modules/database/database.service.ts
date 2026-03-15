import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';
import { DatabaseRepository } from './repository/database.repository';
import { CryptoService } from 'src/common/crypto.service';
import { AdapterFactory } from '../adapters/database-adapter.factory';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly databaseRepository: DatabaseRepository,
    private crypto: CryptoService,
    private adapterFactory: AdapterFactory,
  ) {}

  async create(tenantId: string, dto: CreateDatabaseDto) {
    try {
      const connectionUrl = this.crypto.encrypt(dto.name);
      const db = await this.databaseRepository.create(tenantId, dto);
      const adapter = this.adapterFactory.get(db.engine);
      await adapter.initialize(connectionUrl);
      return db;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(tenantId: string) {
    return this.databaseRepository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    return this.databaseRepository.findOne(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    return this.databaseRepository.delete(tenantId, id);
  }

  async getConnectionUrl(tenantId: string, id: string) {
    const db = await this.databaseRepository.findOne(tenantId, id);
    return this.crypto.decrypt(db.connectionUrl);
  }
}
