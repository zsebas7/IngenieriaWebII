import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const rawCorsOrigins =
    configService.get<string>('CORS_ORIGIN') ?? configService.get<string>('FRONTEND_URL', '');
  const allowedOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowAllOrigins = allowedOrigins.includes('*');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowAllOrigins || allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
