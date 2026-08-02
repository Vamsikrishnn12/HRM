type DatabaseQuery = (sql: string, parameters?: unknown[]) => Promise<unknown>;

export const COMBINED_GOVERNMENT_HOLIDAYS_2026: Array<[string, string]> = [
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
  ['2026-05-01', 'May Day / Buddha Purnima'],
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
  ['2026-11-24', "Guru Nanak's Birthday"],
  ['2026-12-25', 'Christmas'],
];

const SEED_KEY = 'combined_government_holidays_2026_v1';

export const ensureCombinedGovernmentHolidays2026 = async (query: DatabaseQuery): Promise<void> => {
  const markerRows = await query(
    `SELECT "key" FROM "app_runtime_config" WHERE "key" = $1 LIMIT 1`,
    [SEED_KEY],
  ) as Array<{ key: string }>;
  if (markerRows.length > 0) return;

  for (const [date, name] of COMBINED_GOVERNMENT_HOLIDAYS_2026) {
    await query(
      `INSERT INTO "holidays" ("date", "name")
       SELECT $1::date, $2
       WHERE NOT EXISTS (SELECT 1 FROM "holidays" WHERE "date" = $1::date)`,
      [date, name],
    );
  }

  await query(
    `UPDATE "holidays"
     SET "name" = CONCAT("name", ' / Buddha Purnima')
     WHERE "date" = '2026-05-01'::date
       AND LOWER("name") NOT LIKE '%buddha purnima%'`,
  );

  await query(
    `INSERT INTO "app_runtime_config" ("key", "value")
     VALUES ($1, 'completed')
     ON CONFLICT ("key") DO NOTHING`,
    [SEED_KEY],
  );
};
