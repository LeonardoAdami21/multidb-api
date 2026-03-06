// src/modules/billing/billing.constants.ts
export const PLAN_LIMITS = {
  FREE: {
    databases: 1,
    storageMb: 500,
    requestsPerMonth: 10_000,
    requestsPerMinute: 60,
    modelsPerDb: 5,
    manualBackups: false,
    webhooks: 0,
    environments: 1,
  },
  STARTER: {
    databases: 5,
    storageMb: 10_240, // 10 GB
    requestsPerMonth: 500_000,
    requestsPerMinute: 300,
    modelsPerDb: 20,
    manualBackups: true,
    webhooks: 5,
    environments: 2,
  },
  PRO: {
    databases: 25,
    storageMb: 102_400, // 100 GB
    requestsPerMonth: 10_000_000,
    requestsPerMinute: 1_000,
    modelsPerDb: Infinity,
    manualBackups: true,
    webhooks: 50,
    environments: 3,
  },
  ENTERPRISE: {
    databases: Infinity,
    storageMb: Infinity,
    requestsPerMonth: Infinity,
    requestsPerMinute: Infinity,
    modelsPerDb: Infinity,
    manualBackups: true,
    webhooks: Infinity,
    environments: Infinity,
  },
};

export const OVERAGE_PRICES = {
  storagePerGbMonth: 0.1, // R$ per GB/month
  requestsPer10k: 0.5, // R$ per 10k requests
  extraDbPerMonth: 5.0, // R$ per extra database
  backupPerGb: 0.02, // R$ per GB stored
};
