import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { AuthenticatedUser, CurrentUser, Roles } from '@attendance/auth';
import { UserRole } from '@attendance/common';
import { AttendanceService } from './attendance.service';
import { SummaryQueryDto } from './dto/summary-query.dto';

@Controller('attendance')
@Roles(UserRole.EMPLOYEE)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.clockIn(user.userId);
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  clockOut(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.clockOut(user.userId);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SummaryQueryDto,
  ) {
    return this.attendanceService.summary(user.userId, query.from, query.to);
  }
}
