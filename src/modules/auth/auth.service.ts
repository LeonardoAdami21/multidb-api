import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');
    const slug = dto.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        email: dto.email,
        slug: `${slug}-${Date.now()}`,
        plan: 'FREE',
      },
    });
    return {
      tenant,
      token: this.signToken(tenant.id, tenant.email),
    };
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { email: dto.email },
    });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');
    if (tenant.status !== 'ACTIVE')
      throw new UnauthorizedException('Account suspended');

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
      },
      token: this.signToken(tenant.id, tenant.email),
    };
  }

  async validateTenant(tenantId: string) {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  private signToken(tenantId: string, email: string) {
    return this.jwtService.sign({ sub: tenantId, email });
  }
}
