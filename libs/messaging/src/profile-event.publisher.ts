import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EMPLOYEE_PROFILE_UPDATED_EVENT } from './event-types';
import { ProfileUpdatedEvent } from './interfaces/profile-updated-event.interface';
import { RABBITMQ_SERVICE } from './rabbitmq.constants';

@Injectable()
export class ProfileEventPublisher {
  constructor(
    @Inject(RABBITMQ_SERVICE) private readonly client: ClientProxy,
  ) {}

  publishProfileUpdated(event: ProfileUpdatedEvent): void {
    this.client.emit(EMPLOYEE_PROFILE_UPDATED_EVENT, event);
  }
}
