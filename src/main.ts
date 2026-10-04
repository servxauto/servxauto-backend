import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@/core/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '@/core/filters/http-exception.filter';
import { AppValidationPipe } from '@/core/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.set('query parser', 'extended');

  // behind a proxy / load balancer, use the real client IP (rate limiting, logs)
  const trustProxy = Number(config.get('TRUST_PROXY', 0));
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet());

  // app.enableCors({
  //   origin: ['https://servxauto.com'],
  //   credentials: true,
  // });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  app.enableShutdownHooks();

  await app.listen(Number(config.get('PORT', 3000)));
}
void bootstrap();
