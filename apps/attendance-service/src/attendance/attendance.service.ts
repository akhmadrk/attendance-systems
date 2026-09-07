import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ATTENDANCE_LIMITS,
  formatJakartaTime,
  firstDayOfMonthJakarta,
  getJakartaDateString,
} from '@attendance/common';
import { Attendance } from '@attendance/database';
import { Between, Repository } from 'typeorm';

export interface AttendanceResponse {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInDisplay: string | null;
  clockOutDisplay: string | null;
}

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async clockIn(userId: string): Promise<AttendanceResponse> {
    const now = new Date();
    const today = getJakartaDateString(now);

    const existing = await this.attendanceRepo.findOne({
      where: { userId, date: today },
    });
    if (existing) {
      throw new ConflictException(
        existing.clockOut
          ? 'You have already completed attendance for today'
          : 'You have already clocked in today without clocking out',
      );
    }

    const record = this.attendanceRepo.create({
      userId,
      date: today,
      clockIn: now,
      clockOut: null,
    });

    try {
      const saved = await this.attendanceRepo.save(record);
      return this.toResponse(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'You have already clocked in today without clocking out',
        );
      }
      throw error;
    }
  }

  async clockOut(userId: string): Promise<AttendanceResponse> {
    const now = new Date();
    const today = getJakartaDateString(now);

    const result = await this.attendanceRepo
      .createQueryBuilder()
      .update(Attendance)
      .set({ clockOut: now })
      .where('user_id = :userId AND date = :date', { userId, date: today })
      .andWhere('clock_in IS NOT NULL')
      .andWhere('clock_out IS NULL')
      .execute();

    if (!result.affected) {
      const existing = await this.attendanceRepo.findOne({
        where: { userId, date: today },
      });
      if (!existing || !existing.clockIn) {
        throw new BadRequestException(
          'Cannot clock out without clocking in first',
        );
      }
      throw new ConflictException('You have already clocked out today');
    }

    const updated = await this.attendanceRepo.findOne({
      where: { userId, date: today },
    });
    if (!updated) {
      throw new BadRequestException(
        'Cannot clock out without clocking in first',
      );
    }
    return this.toResponse(updated);
  }

  async summary(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<AttendanceResponse[]> {
    const now = new Date();
    const fromDate = from ?? firstDayOfMonthJakarta(now);
    const toDate = to ?? getJakartaDateString(now);

    if (fromDate > toDate) {
      throw new BadRequestException(
        '"from" date must be before or equal to "to" date',
      );
    }

    if (this.daysBetween(fromDate, toDate) > ATTENDANCE_LIMITS.MAX_DATE_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${ATTENDANCE_LIMITS.MAX_DATE_RANGE_DAYS} days`,
      );
    }

    const records = await this.attendanceRepo.find({
      where: { userId, date: Between(fromDate, toDate) },
      order: { date: 'DESC' },
    });

    return records.map((record) => this.toResponse(record));
  }

  private toResponse(record: Attendance): AttendanceResponse {
    return {
      id: record.id,
      date: record.date,
      clockIn: record.clockIn ? record.clockIn.toISOString() : null,
      clockOut: record.clockOut ? record.clockOut.toISOString() : null,
      clockInDisplay: record.clockIn ? formatJakartaTime(record.clockIn) : null,
      clockOutDisplay: record.clockOut
        ? formatJakartaTime(record.clockOut)
        : null,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === PG_UNIQUE_VIOLATION
    );
  }

  private daysBetween(from: string, to: string): number {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    return Math.ceil((toMs - fromMs) / 86_400_000);
  }
}
