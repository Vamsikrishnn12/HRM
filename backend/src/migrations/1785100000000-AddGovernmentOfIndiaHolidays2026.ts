import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGovernmentOfIndiaHolidays1785100000000 implements MigrationInterface {
  name = 'AddGovernmentOfIndiaHolidays1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const mayDayRows: Array<{ id: string; name: string }> = await queryRunner.query(
      `SELECT "id", "name" FROM "holidays" WHERE "date" = '2026-05-01'::date LIMIT 1`,
    );

    if (mayDayRows.length === 0) {
      await queryRunner.query(
        `INSERT INTO "holidays" ("date", "name") VALUES ('2026-05-01', 'Buddha Purnima')`,
      );
    } else if (!mayDayRows[0].name.toLowerCase().includes('buddha purnima')) {
      await queryRunner.query(
        `UPDATE "holidays" SET "name" = CONCAT("name", ' / Buddha Purnima') WHERE "id" = $1`,
        [mayDayRows[0].id],
      );
    }

    await queryRunner.query(
      `INSERT INTO "holidays" ("date", "name")
       SELECT '2026-11-24'::date, 'Guru Nanak''s Birthday'
       WHERE NOT EXISTS (SELECT 1 FROM "holidays" WHERE "date" = '2026-11-24'::date)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "holidays" SET "name" = 'May Day'
       WHERE "date" = '2026-05-01'::date AND "name" = 'May Day / Buddha Purnima'`,
    );
    await queryRunner.query(
      `DELETE FROM "holidays"
       WHERE "date" = '2026-11-24'::date AND "name" = 'Guru Nanak''s Birthday'`,
    );
  }
}
