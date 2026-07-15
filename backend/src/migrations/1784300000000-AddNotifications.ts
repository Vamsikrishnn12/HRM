import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1784300000000 implements MigrationInterface {
  name = 'AddNotifications1784300000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "recipientId" uuid NOT NULL,
      "type" character varying(50) NOT NULL,
      "title" character varying(200) NOT NULL,
      "message" text NOT NULL,
      "actionUrl" character varying(500),
      "isRead" boolean NOT NULL DEFAULT false,
      "readAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
      CONSTRAINT "FK_notifications_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient_created" ON "notifications" ("recipientId", "createdAt")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
