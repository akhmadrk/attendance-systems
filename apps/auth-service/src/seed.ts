import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AUTH, UserRole, UserStatus } from '@attendance/common';
import { PrimaryDataSource, User } from '@attendance/database';

const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin123!';
const EMPLOYEE_PASSWORD = 'Employee123!';

const EMPLOYEE_POSITIONS = [
  'Software Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Engineer',
  'DevOps Engineer',
];

async function upsertUser(
  repo: Repository<User>,
  data: Partial<User>,
): Promise<void> {
  const existing = await repo.findOne({ where: { email: data.email } });
  if (existing) {
    return;
  }
  await repo.save(repo.create(data));
}

async function seed(): Promise<void> {
  await PrimaryDataSource.initialize();
  const userRepo = PrimaryDataSource.getRepository(User);
  const logger = new Logger('Seed');

  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, AUTH.BCRYPT_SALT_ROUNDS);
  const employeePassword = await bcrypt.hash(
    EMPLOYEE_PASSWORD,
    AUTH.BCRYPT_SALT_ROUNDS,
  );

  await upsertUser(userRepo, {
    name: 'HRD Administrator',
    email: ADMIN_EMAIL,
    password: adminPassword,
    position: 'HRD Manager',
    phoneNumber: '+6281000000000',
    photoUrl: null,
    role: UserRole.HRD,
    status: UserStatus.ACTIVE,
  });

  for (let i = 1; i <= 5; i += 1) {
    await upsertUser(userRepo, {
      name: `Employee ${i}`,
      email: `employee${i}@company.com`,
      password: employeePassword,
      position: EMPLOYEE_POSITIONS[i - 1],
      phoneNumber: `+62810000000${i.toString().padStart(2, '0')}`,
      photoUrl: null,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    });
  }

  const count = await userRepo.count();
  logger.log(`Seed completed. Total users: ${count}`);
  await PrimaryDataSource.destroy();
}

seed().catch((error: unknown) => {
  Logger.error('Seed failed', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
