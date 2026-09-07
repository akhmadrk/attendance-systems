import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileChangeLog } from '@attendance/database';
import {
  EMPLOYEE_PROFILE_UPDATED_EVENT,
  ProfileUpdatedEvent,
} from '@attendance/messaging';
import { NotificationsGateway } from '@attendance/notifications';
import { Repository } from 'typeorm';

@Controller()
export class ProfileUpdatedConsumer {
  constructor(
    @InjectRepository(ProfileChangeLog)
    private readonly logRepo: Repository<ProfileChangeLog>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @EventPattern(EMPLOYEE_PROFILE_UPDATED_EVENT)
  async handleProfileUpdated(event: ProfileUpdatedEvent): Promise<void> {
    await this.logRepo.save(
      this.logRepo.create({
        userId: event.userId,
        userName: event.userName,
        changedFields: event.changedFields,
        ipAddress: event.metadata.ipAddress,
        userAgent: event.metadata.userAgent,
        timestamp: new Date(event.timestamp),
      }),
    );

    this.notificationsGateway.emitProfileUpdated(event);
  }
}
