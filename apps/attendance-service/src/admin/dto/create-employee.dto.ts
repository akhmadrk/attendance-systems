import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_COMPLEXITY_REGEX,
  PHONE_NUMBER_REGEX,
  UserRole,
  UserStatus,
} from '@attendance/common';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message:
      'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number',
  })
  password: string;

  @IsOptional()
  @Matches(PHONE_NUMBER_REGEX, { message: 'Invalid phone number format' })
  phoneNumber?: string;
}
