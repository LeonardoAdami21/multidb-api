export interface DatabaseAdapter {
  /** Provision a new database and return the connection URL */
  provision(tenantId: string, name: string): Promise<any>;

  /** Run initial setup (extensions, collations, etc.) */
  initialize(connectionUrl: string): Promise<void>;

  /** Drop the database */
  drop(connectionUrl: string, tenantId: string, name: string): Promise<any>;

  /** Get size in bytes */
  getSize(connectionUrl: string): Promise<any>;

  /** Execute a raw SQL/query string */
  executeRaw(
    connectionUrl: string,
    query: string,
    params?: any[],
  ): Promise<any>;

  /** Build Prisma datasource URL for this engine */
  buildPrismaUrl(connectionUrl: string): any;
}
