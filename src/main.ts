import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { winstonConfig } from './config/wiston.config';
import { HttpExceptionFilter } from './common/filters/http-exepction';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import express from 'express';

const expressApp = express();

export async function createApp() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: WinstonModule.createLogger(winstonConfig),
    },
  );

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('v1');

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Tenant-ID',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new MetricsInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('MultiDB API')
    .addTag('auth', 'Authenticação e Autorização')
    .addTag('audit', 'Modulo de Auditoria')
    .addTag('backup', 'Modulo de Backup')
    .addTag('billing', 'Modulo de Cobrança')
    .addTag('database', 'Modulo Bancos de Dados')
    .addTag('graphQL', 'GraphQL dinâmico por tenant')
    .addTag('metrics', 'Modulo de Metricas')
    .addTag('data', 'Modulo de Schema Engine')
    .addTag('schema', 'Modulo de Schema')
    .addTag('sdk', 'Modulo de SDK')
    .addTag('tenant', 'Modulo de Tenants')
    .addTag('webhook', 'Modulo de Webhooks')
    .addBearerAuth()
    .addApiKey({ name: 'x-api-key', type: 'apiKey', in: 'header' })
    .setDescription(
      'Plataforma de Bancos de Dados como Serviço — PostgreSQL, MySQL, MongoDB, SQLite',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/docs', app, document);

  await app.init();
  return expressApp;
}

// Local development only
if (require.main === module) {
  createApp().then((server) => {
    const port = process.env.APP_PORT || 3000;
    server.listen(port, () => {
      console.log(`Running on: http://localhost:${port}/v1/docs`);
    });
  });
}
