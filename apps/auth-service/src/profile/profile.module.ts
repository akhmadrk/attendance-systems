import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@attendance/database';
import { ProfileEventPublisherModule } from '@attendance/messaging';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ProfileEventPublisherModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
