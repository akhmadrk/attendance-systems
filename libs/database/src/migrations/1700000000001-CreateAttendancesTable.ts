import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendancesTable1700000000001 implements MigrationInterface {
  name = 'CreateAttendancesTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "date" date NOT NULL,
        "clock_in" timestamp,
        "clock_out" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendances" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_attendances_user_date" UNIQUE ("user_id", "date"),
        CONSTRAINT "FK_attendances_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_attendances_user_id" ON "attendances" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendances_date" ON "attendances" ("date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_attendances_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendances_user_id"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
  }
}
