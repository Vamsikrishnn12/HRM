import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalaryBankAccountHolder1784100000000 implements MigrationInterface {
  name = 'AddSalaryBankAccountHolder1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salary_details" ADD COLUMN IF NOT EXISTS "accountHolderName" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "salary_details" ADD COLUMN IF NOT EXISTS "bankMobileNumber" character varying(15)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salary_details" DROP COLUMN IF EXISTS "bankMobileNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "salary_details" DROP COLUMN IF EXISTS "accountHolderName"`,
    );
  }
}
