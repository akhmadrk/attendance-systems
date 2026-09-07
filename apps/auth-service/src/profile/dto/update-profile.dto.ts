import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_COMPLEXITY_REGEX, PHONE_NUMBER_REGEX } from '@attendance/common';

export class UpdateProfileDto {
  @IsOptional()
  @Matches(PHONE_NUMBER_REGEX, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message:
      'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number',
  })
  newPassword?: string;
}
