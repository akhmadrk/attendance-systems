import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatJakartaTime, PAGINATION } from '@attendance/common';
import { Attendance } from '@attendance/database';
import { Repository } from 'typeorm';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';

export interface AdminAttendanceRow {
  id: string;
  userId: string;
  userName: string;
  email: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInDisplay: string | null;
  clockOutDisplay: string | null;
}

export interface CsvRow {
  employeeName: string;
  email: string;
  date: string;
  clockIn: string;
  clockOut: string;
}

@Injectable()
export class AdminAttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async list(
    query: AdminAttendanceQueryDto,
  ): Promise<{ data: AdminAttendanceRow[]; total: number; page: number; limit: number }> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const qb = this.attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .orderBy('attendance.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.userId) {
      qb.andWhere('attendance.user_id = :userId', { userId: query.userId });
    }
    if (query.from && query.to) {
      qb.andWhere('attendance.date BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      });
    } else if (query.from) {
      qb.andWhere('attendance.date >= :from', { from: query.from });
    } else if (query.to) {
      qb.andWhere('attendance.date <= :to', { to: query.to });
    }

    if (query.status === 'CLOCK_IN') {
      qb.andWhere('attendance.clock_in IS NOT NULL AND attendance.clock_out IS NULL');
    } else if (query.status === 'CLOCK_OUT') {
      qb.andWhere('attendance.clock_in IS NOT NULL AND attendance.clock_out IS NOT NULL');
    }

    const [records, total] = await qb.getManyAndCount();

    return {
      data: records.map((record) => this.toRow(record)),
      total,
      page,
      limit,
    };
  }

  async exportCsv(query: AdminAttendanceQueryDto): Promise<CsvRow[]> {
    const qb = this.attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .orderBy('attendance.date', 'DESC');

    if (query.userId) {
      qb.andWhere('attendance.user_id = :userId', { userId: query.userId });
    }
    if (query.from && query.to) {
      qb.andWhere('attendance.date BETWEEN :from AND :to', {
        from: query.from,
        to: query.to,
      });
    }

    const records = await qb.getMany();
    return records.map((record) => ({
      employeeName: record.user?.name ?? 'Unknown',
      email: record.user?.email ?? '',
      date: record.date,
      clockIn: record.clockIn ? formatJakartaTime(record.clockIn) : '',
      clockOut: record.clockOut ? formatJakartaTime(record.clockOut) : '',
    }));
  }

  private toRow(record: Attendance): AdminAttendanceRow {
    return {
      id: record.id,
      userId: record.userId,
      userName: record.user?.name ?? 'Unknown',
      email: record.user?.email ?? '',
      date: record.date,
      clockIn: record.clockIn ? record.clockIn.toISOString() : null,
      clockOut: record.clockOut ? record.clockOut.toISOString() : null,
      clockInDisplay: record.clockIn ? formatJakartaTime(record.clockIn) : null,
      clockOutDisplay: record.clockOut
        ? formatJakartaTime(record.clockOut)
        : null,
    };
  }
}
