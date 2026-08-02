import { MigrationInterface, QueryRunner } from 'typeorm';

const TAMIL_NADU_GOVERNMENT_HOLIDAYS_2026: Array<[string, string]> = [
  ['2026-01-01', "New Year's Day"],
  ['2026-01-15', 'Pongal'],
  ['2026-01-16', 'Thiruvalluvar Day'],
  ['2026-01-17', 'Uzhavar Thirunal'],
  ['2026-01-26', 'Republic Day'],
  ['2026-02-01', 'Thai Poosam'],
  ['2026-03-19', "Telugu New Year's Day"],
  ['2026-03-21', "Ramzan (Idu'l Fitr)"],
  ['2026-03-31', 'Mahaveer Jayanthi'],
  ['2026-04-03', 'Good Friday'],
  ['2026-04-14', "Tamil New Year's Day / Dr. B.R. Ambedkar's Birthday"],
  ['2026-05-01', 'May Day'],
  ['2026-05-28', 'Bakrid (Idul Azha)'],
  ['2026-06-26', 'Muharram (Yaom-e-Shahadath)'],
  ['2026-08-15', 'Independence Day'],
  ['2026-08-26', "Milad-un-Nabi (Prophet's Birthday)"],
  ['2026-09-04', 'Krishna Jayanthi'],
  ['2026-09-14', 'Vinayakar Chathurthi'],
  ['2026-10-02', 'Gandhi Jayanthi'],
  ['2026-10-19', 'Ayutha Pooja'],
  ['2026-10-20', 'Vijaya Dasami'],
  ['2026-11-08', 'Deepavali'],
  ['2026-12-25', 'Christmas'],
];

export class SeedTamilNaduGovernmentHolidays1785000000000 implements MigrationInterface {
  name = 'SeedTamilNaduGovernmentHolidays1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [date, name] of TAMIL_NADU_GOVERNMENT_HOLIDAYS_2026) {
      await queryRunner.query(
        `INSERT INTO "holidays" ("date", "name")
         SELECT $1::date, $2
         WHERE NOT EXISTS (SELECT 1 FROM "holidays" WHERE "date" = $1::date)`,
        [date, name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [date, name] of TAMIL_NADU_GOVERNMENT_HOLIDAYS_2026) {
      await queryRunner.query(
        `DELETE FROM "holidays" WHERE "date" = $1::date AND "name" = $2`,
        [date, name],
      );
    }
  }
}
