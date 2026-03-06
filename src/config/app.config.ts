// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '7000', 10),
  env: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  encryptionKey:
    process.env.ENCRYPTION_KEY ?? 'change-me-32-chars-encryption-key',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:7000',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  postgres: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  },
  mysql: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
  },
  mongo: {
    uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
  },
  sqlite: {
    storagePath: process.env.SQLITE_STORAGE_PATH ?? '/data/sqlite',
  },
  backup: {
    storagePath: process.env.BACKUP_STORAGE_PATH ?? '/data/backups',
  },
}));
