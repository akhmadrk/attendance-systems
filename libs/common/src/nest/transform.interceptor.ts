import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();
        if (request.originalUrl?.startsWith('/health')) {
          return data;
        }
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in (data as Record<string, unknown>)
        ) {
          return data;
        }
        const response = context.switchToHttp().getResponse<Response>();
        return {
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
