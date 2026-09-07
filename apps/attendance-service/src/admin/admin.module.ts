import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance, User } from '@attendance/database';
import { AdminAttendanceController } from './admin-attendance.controller';
import { AdminAttendanceService } from './admin-attendance.service';
import { AdminEmployeeController } from './admin-employee.controller';
import { AdminEmployeeService } from './admin-employee.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Attendance])],
  controllers: [AdminEmployeeController, AdminAttendanceController],
  providers: [AdminEmployeeService, AdminAttendanceService],
})
export class AdminModule {}
