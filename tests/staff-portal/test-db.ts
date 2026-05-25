import Database from 'better-sqlite3';
import type { AsyncDb, DbResult } from '$lib/server/db';

export function createMemoryDb(schemaSql: string): { db: AsyncDb; sqlite: Database.Database } {
  const sqlite = new Database(':memory:');
  sqlite.exec(schemaSql);
  const db: AsyncDb = {
    async queryOne<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async queryAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async exec(sql: string, ...params: unknown[]): Promise<DbResult> {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    },
    raw(sql: string) {
      return { run: async () => { sqlite.prepare(sql).run(); } };
    }
  };
  return { db, sqlite };
}
