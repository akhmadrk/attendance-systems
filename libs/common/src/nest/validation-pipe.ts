import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = errors.map((error) => ({
        field: error.property,
        message:
          Object.values(error.constraints ?? {})[0] ?? 'Invalid value',
      }));
      return new BadRequestException({
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Validation failed',
        details,
      });
    },
  });
}
