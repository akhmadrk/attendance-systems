import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@attendance/auth';
import { PAGINATION, toPaginatedResponse, UserRole } from '@attendance/common';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogService } from './audit-log.service';

@Controller('admin/audit-logs')
@Roles(UserRole.HRD)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.list({
      ...query,
      page: query.page ?? PAGINATION.DEFAULT_PAGE,
      limit: query.limit ?? PAGINATION.DEFAULT_LIMIT,
    });
    return toPaginatedResponse(result.data, result.page, result.limit, result.total);
  }
}
