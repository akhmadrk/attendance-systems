import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AllExceptionsFilter,
  createValidationPipe,
  TransformInterceptor,
} from '@attendance/common';
import { JwtAuthGuard, RolesGuard } from '@attendance/auth';
import { ProfileChangeLog } from '@attendance/database';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('AUDIT_DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('AUDIT_DB_PORT', '5433'), 10),
        username: config.get<string>('AUDIT_DB_USERNAME', 'audit'),
        password: config.get<string>('AUDIT_DB_PASSWORD', 'audit'),
        database: config.get<string>('AUDIT_DB_NAME', 'audit'),
        entities: [ProfileChangeLog],
        synchronize: false,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),
    TerminusModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useValue: createValidationPipe() },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
