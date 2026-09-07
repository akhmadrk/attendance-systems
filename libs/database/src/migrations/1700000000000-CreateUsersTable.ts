import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1700000000000 implements MigrationInterface {
  name = 'CreateUsersTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('EMPLOYEE', 'HRD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_status_enum" AS ENUM ('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "email" character varying(100) NOT NULL,
        "password" character varying(255) NOT NULL,
        "position" character varying(100) NOT NULL,
        "phone_number" character varying(20),
        "photo_url" character varying(500),
        "role" "users_role_enum" NOT NULL DEFAULT 'EMPLOYEE',
        "status" "users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" timestamp,
        "refresh_token" character varying(500),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
