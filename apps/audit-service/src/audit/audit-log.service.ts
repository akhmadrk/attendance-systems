import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PAGINATION } from '@attendance/common';
import { ProfileChangeLog } from '@attendance/database';
import { Repository } from 'typeorm';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface AuditLogResponse {
  id: string;
  userId: string;
  userName: string;
  changedFields: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(ProfileChangeLog)
    private readonly logRepo: Repository<ProfileChangeLog>,
  ) {}

  async list(
    query: AuditLogQueryDto,
  ): Promise<{ data: AuditLogResponse[]; total: number; page: number; limit: number }> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const qb = this.logRepo
      .createQueryBuilder('log')
      .orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.userId) {
      qb.andWhere('log.user_id = :userId', { userId: query.userId });
    }
    if (query.from) {
      qb.andWhere('log.timestamp >= :from', { from: `${query.from}T00:00:00` });
    }
    if (query.to) {
      qb.andWhere('log.timestamp <= :to', { to: `${query.to}T23:59:59` });
    }

    const [logs, total] = await qb.getManyAndCount();

    return {
      data: logs.map((log) => this.toResponse(log)),
      total,
      page,
      limit,
    };
  }

  private toResponse(log: ProfileChangeLog): AuditLogResponse {
    return {
      id: log.id,
      userId: log.userId,
      userName: log.userName,
      changedFields: this.maskSensitive(log.changedFields),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp,
    };
  }

  private maskSensitive(
    fields: Record<string, { old: unknown; new: unknown }>,
  ): Record<string, { old: unknown; new: unknown }> {
    const masked: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'password' || key === 'refresh_token' || key === 'access_token') {
        masked[key] = { old: '********', new: '********' };
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
}
