import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProfileEventPublisher } from './profile-event.publisher';
import { PROFILE_UPDATED_QUEUE, RABBITMQ_SERVICE } from './rabbitmq.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: PROFILE_UPDATED_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [ProfileEventPublisher],
  exports: [ProfileEventPublisher],
})
export class ProfileEventPublisherModule {}
