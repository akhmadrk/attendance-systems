import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileChangeLog } from '@attendance/database';
import { NotificationsModule } from '@attendance/notifications';
import { ProfileUpdatedConsumer } from './audit.consumer';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileChangeLog]), NotificationsModule],
  controllers: [ProfileUpdatedConsumer, AuditLogController],
  providers: [AuditLogService],
})
export class AuditModule {}
