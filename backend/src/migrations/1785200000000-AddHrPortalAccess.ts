import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHrPortalAccess1785200000000 implements MigrationInterface {
  name = 'AddHrPortalAccess1785200000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "hr_portal_access" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employeeId" uuid NOT NULL,
      "loginEmail" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL,
      "isActive" boolean NOT NULL DEFAULT true, "grantedBy" uuid NOT NULL,
      "grantedAt" timestamp NOT NULL DEFAULT now(), "revokedBy" uuid, "revokedAt" timestamp,
      "lastLoginAt" timestamp, "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_hr_portal_access" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_hr_portal_access_employee" UNIQUE ("employeeId"),
      CONSTRAINT "UQ_hr_portal_access_email" UNIQUE ("loginEmail"),
      CONSTRAINT "FK_hr_portal_access_employee" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hr_portal_access_active" ON "hr_portal_access" ("isActive")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hr_portal_access"`);
  }
}
