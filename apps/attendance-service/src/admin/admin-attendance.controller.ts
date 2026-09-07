import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { Roles } from '@attendance/auth';
import { PAGINATION, toPaginatedResponse, UserRole } from '@attendance/common';
import { Response } from 'express';
import { AdminAttendanceService } from './admin-attendance.service';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';
import { toCsv } from './csv.util';

@Controller('admin/attendances')
@Roles(UserRole.HRD)
export class AdminAttendanceController {
  constructor(private readonly adminAttendanceService: AdminAttendanceService) {}

  @Get()
  async list(@Query() query: AdminAttendanceQueryDto) {
    const result = await this.adminAttendanceService.list({
      ...query,
      page: query.page ?? PAGINATION.DEFAULT_PAGE,
      limit: query.limit ?? PAGINATION.DEFAULT_LIMIT,
    });
    return toPaginatedResponse(result.data, result.page, result.limit, result.total);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header(
    'Content-Disposition',
    `attachment; filename="attendance-export-${new Date().toISOString().slice(0, 10)}.csv"`,
  )
  async exportCsv(
    @Query() query: AdminAttendanceQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const rows = await this.adminAttendanceService.exportCsv(query);
    res.send(toCsv(rows));
  }
}
