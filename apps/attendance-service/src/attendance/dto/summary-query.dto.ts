import { IsOptional, Matches } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class SummaryQueryDto {
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'from must be a valid date (YYYY-MM-DD)' })
  from?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'to must be a valid date (YYYY-MM-DD)' })
  to?: string;
}
