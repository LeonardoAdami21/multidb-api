// src/modules/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import * as prom from 'prom-client';

@Injectable()
export class MetricsService {
  readonly requestsTotal: prom.Counter;
  readonly queryDuration: prom.Histogram;
  readonly activeConnections: prom.Gauge;
  readonly cacheHitRatio: prom.Gauge;
  readonly slowQueriesTotal: prom.Counter;
  readonly webhookFailures: prom.Counter;

  constructor() {
    // Clear default metrics to avoid re-registration on hot reload
    prom.register.clear();
    prom.collectDefaultMetrics({ prefix: 'multidb_' });

    this.requestsTotal = new prom.Counter({
      name: 'multidb_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['tenant_id', 'method', 'route', 'status'],
    });

    this.queryDuration = new prom.Histogram({
      name: 'multidb_query_duration_ms',
      help: 'Query execution duration in milliseconds',
      labelNames: ['tenant_id', 'model', 'operation'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
    });

    this.activeConnections = new prom.Gauge({
      name: 'multidb_active_connections',
      help: 'Active database connections',
      labelNames: ['tenant_id', 'engine'],
    });

    this.cacheHitRatio = new prom.Gauge({
      name: 'multidb_cache_hit_ratio',
      help: 'Cache hit ratio per tenant',
      labelNames: ['tenant_id'],
    });

    this.slowQueriesTotal = new prom.Counter({
      name: 'multidb_slow_queries_total',
      help: 'Queries exceeding 500ms threshold',
      labelNames: ['tenant_id', 'model'],
    });

    this.webhookFailures = new prom.Counter({
      name: 'multidb_webhook_failures_total',
      help: 'Webhook delivery failures',
      labelNames: ['tenant_id'],
    });
  }

  async getMetrics(): Promise<string> {
    return prom.register.metrics();
  }

  observeQuery(
    tenantId: string,
    model: string,
    operation: string,
    durationMs: number,
  ) {
    this.queryDuration.observe(
      { tenant_id: tenantId, model, operation },
      durationMs,
    );
    if (durationMs > 500) {
      this.slowQueriesTotal.inc({ tenant_id: tenantId, model });
    }
  }

  recordRequest(
    tenantId: string,
    method: string,
    route: string,
    status: number,
  ) {
    this.requestsTotal.inc({
      tenant_id: tenantId,
      method,
      route,
      status: String(status),
    });
  }
}
