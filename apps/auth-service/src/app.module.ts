import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AllExceptionsFilter,
  createValidationPipe,
  TransformInterceptor,
} from '@attendance/common';
import { JwtAuthGuard, RolesGuard } from '@attendance/auth';
import { Attendance, User } from '@attendance/database';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('PRIMARY_DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('PRIMARY_DB_PORT', '5432'), 10),
        username: config.get<string>('PRIMARY_DB_USERNAME', 'attendance'),
        password: config.get<string>('PRIMARY_DB_PASSWORD', 'attendance'),
        database: config.get<string>('PRIMARY_DB_NAME', 'attendance'),
        entities: [User, Attendance],
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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads', 'photos'),
      serveRoot: '/uploads/photos',
    }),
    TerminusModule,
    AuthModule,
    ProfileModule,
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
