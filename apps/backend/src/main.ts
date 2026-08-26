import 'reflect-metadata';
import './common/bigint-json';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  // Validation is per-route via ZodValidationPipe (see AuthController), not
  // a global class-validator pipe — this project deliberately uses Zod
  // schemas shared with the frontend (plan §2) instead of class-validator
  // decorators, so @nestjs/common's ValidationPipe is intentionally unused.

  const config = new DocumentBuilder()
    .setTitle('ESG Auditing Platform API')
    .setDescription('Work orders, ESG metrics, emission factors, and report generation for HK recycling facilities')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`ESG backend listening on port ${port}`);
}

bootstrap();
