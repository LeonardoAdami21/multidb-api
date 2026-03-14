// src/modules/tenants/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './repository/tenant.repository';

@Injectable()
export class TenantService {
  constructor(private tenantRepository: TenantsRepository) {}

  async findOne(tenantId: string) {
    const tenant = await this.tenantRepository.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(tenantId: string, data: { name?: string }) {
    return  this.tenantRepository.update(tenantId, data);
  }

  async delete(tenantId: string) {
    return this.tenantRepository.delete(tenantId);
  }

  async getAlerts(tenantId: string) {
    const alerts = await this.tenantRepository.getAlerts(tenantId);
    return alerts;
  }

  async resolveAlert(tenantId: string, alertId: string) {
    return this.tenantRepository.resolveAlert(tenantId, alertId);
  }
}
