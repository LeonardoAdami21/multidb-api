import { PrismaClient } from "@prisma/client";

export interface PoolEntry {
  client: PrismaClient;
  lastUsed: Date;
  tenantId: string;
}