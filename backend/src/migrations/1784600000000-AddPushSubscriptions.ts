import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushSubscriptions1784600000000 implements MigrationInterface {
  name = 'AddPushSubscriptions1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "push_subscriptions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL,
      "endpoint" text NOT NULL,
      "p256dh" text NOT NULL,
      "auth" text NOT NULL,
      "userAgent" character varying(500),
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_push_subscriptions_endpoint" UNIQUE ("endpoint"),
      CONSTRAINT "FK_push_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_push_subscriptions_user" ON "push_subscriptions" ("userId")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "app_runtime_config" (
      "key" character varying(100) NOT NULL,
      "value" text NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "PK_app_runtime_config" PRIMARY KEY ("key")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_runtime_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions"`);
  }
}
