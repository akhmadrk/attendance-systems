import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
import { CreateProfileChangeLogsTable1700000000002 } from './migrations/1700000000002-CreateProfileChangeLogsTable';

export const AuditDataSource = new DataSource({
  type: 'postgres',
  host: process.env.AUDIT_DB_HOST ?? 'localhost',
  port: parseInt(process.env.AUDIT_DB_PORT ?? '5433', 10),
  username: process.env.AUDIT_DB_USERNAME ?? 'audit',
  password: process.env.AUDIT_DB_PASSWORD ?? 'audit',
  database: process.env.AUDIT_DB_NAME ?? 'audit',
  entities: [ProfileChangeLog],
  migrations: [CreateProfileChangeLogsTable1700000000002],
  synchronize: false,
  logging: false,
});
