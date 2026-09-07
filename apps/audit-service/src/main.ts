import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { PROFILE_UPDATED_QUEUE } from '@attendance/messaging';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.AUDIT_SERVICE_PORT ?? '3002', 10);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: PROFILE_UPDATED_QUEUE,
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Audit service listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
