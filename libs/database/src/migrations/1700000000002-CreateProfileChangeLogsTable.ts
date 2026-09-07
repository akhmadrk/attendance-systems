import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileChangeLogsTable1700000000002
  implements MigrationInterface
{
  name = 'CreateProfileChangeLogsTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "profile_change_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "user_name" character varying(100) NOT NULL,
        "changed_fields" jsonb NOT NULL,
        "ip_address" character varying(45) NOT NULL,
        "user_agent" text NOT NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_change_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_profile_change_logs_user_id" ON "profile_change_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_profile_change_logs_timestamp" ON "profile_change_logs" ("timestamp")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_profile_change_logs_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_profile_change_logs_user_id"`);
    await queryRunner.query(`DROP TABLE "profile_change_logs"`);
  }
}
