import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.ATTENDANCE_SERVICE_PORT ?? '3001', 10);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  await app.listen(port);
  Logger.log(
    `Attendance service listening on http://localhost:${port}`,
    'Bootstrap',
  );
}

void bootstrap();
