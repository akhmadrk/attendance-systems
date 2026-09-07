import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorDetail {
  field: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = this.normalizeHttpException(exception, statusCode);
      response.status(statusCode).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }

  private normalizeHttpException(
    exception: HttpException,
    statusCode: number,
  ): Record<string, unknown> {
    const res = exception.getResponse();

    if (typeof res === 'string') {
      return {
        statusCode,
        error: HttpStatus[statusCode] ?? 'ERROR',
        message: res,
      };
    }

    if (typeof res === 'object' && res !== null) {
      const r = res as Record<string, unknown>;
      const details = Array.isArray(r.details)
        ? (r.details as ErrorDetail[])
        : undefined;
      const message =
        typeof r.message === 'string'
          ? r.message
          : Array.isArray(r.message)
            ? 'Validation failed'
            : exception.message;

      return {
        statusCode,
        error: HttpStatus[statusCode] ?? (typeof r.error === 'string' ? r.error : 'ERROR'),
        message,
        ...(details ? { details } : {}),
      };
    }

    return {
      statusCode,
      error: HttpStatus[statusCode] ?? 'ERROR',
      message: exception.message,
    };
  }
}
