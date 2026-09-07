import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class AdminAttendanceQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'from must be a valid date (YYYY-MM-DD)' })
  from?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'to must be a valid date (YYYY-MM-DD)' })
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
