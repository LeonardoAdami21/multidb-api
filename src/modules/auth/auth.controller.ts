// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private apiKeys: ApiKeyService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar novo tenant',
    description: 'Rota para registrar um novo tenant',
  })
  @ApiCreatedResponse({ description: 'Tenant criado com sucesso' })
  @ApiConflictResponse({ description: 'Email já cadastrado' })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login do tenant', description: 'Rota de login' })
  @ApiCreatedResponse({ description: 'Tenant logado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar API Key',
    description: 'Rota de criação de API Key',
  })
  @ApiCreatedResponse({ description: 'API Key criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  createApiKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(req.user.tenantId, dto);
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar API Keys',
    description: 'Rota de listagem de API Keys',
  })
  @ApiOkResponse({ description: 'API Keys listadas com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  listApiKeys(@Request() req: any) {
    return this.apiKeys.findAll(req.user.tenantId);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revogar API Key',
    description: 'Rota de revogação de API Key',
  })
  @ApiOkResponse({ description: 'API Key revogada com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  revokeApiKey(@Request() req: any, @Param('id') id: string) {
    return this.apiKeys.revoke(req.user.tenantId, id);
  }
}
