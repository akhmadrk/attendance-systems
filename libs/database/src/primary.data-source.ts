import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { User } from './entities/user.entity';
import { CreateAttendancesTable1700000000001 } from './migrations/1700000000001-CreateAttendancesTable';
import { CreateUsersTable1700000000000 } from './migrations/1700000000000-CreateUsersTable';

export const PrimaryDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PRIMARY_DB_HOST ?? 'localhost',
  port: parseInt(process.env.PRIMARY_DB_PORT ?? '5432', 10),
  username: process.env.PRIMARY_DB_USERNAME ?? 'attendance',
  password: process.env.PRIMARY_DB_PASSWORD ?? 'attendance',
  database: process.env.PRIMARY_DB_NAME ?? 'attendance',
  entities: [User, Attendance],
  migrations: [CreateUsersTable1700000000000, CreateAttendancesTable1700000000001],
  synchronize: false,
  logging: false,
});
