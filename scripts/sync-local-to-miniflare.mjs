import Database from 'better-sqlite3';

const SRC = './app_data/portal.db';
const DST = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/40a6e0a9d8a0056b2e812e1e4636887983959b86ada94e04afa553053be31098.sqlite';

const src = new Database(SRC);
const dst = new Database(DST);
dst.pragma('foreign_keys = OFF');

const TABLES = ['users', 'reports', 'receipts', 'pipeline_status', 'transcripts'];

for (const table of TABLES) {
  const rows = src.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(',');

  const insert = dst.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);

  const insertMany = dst.transaction((rows) => {
    for (const row of rows) {
      insert.run(columns.map(c => row[c] ?? null));
    }
  });

  insertMany(rows);
  console.log(`Synced ${rows.length} rows into ${table}`);
}

dst.close();
src.close();
console.log('Done');
