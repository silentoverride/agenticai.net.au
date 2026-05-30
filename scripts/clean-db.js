#!/usr/bin/env node
/**
 * Delete all records from every existing table except the admin user.
 * Discovers tables from sqlite_master so it works with any migration state.
 *
 * Usage:  node scripts/clean-db.js [--admin clerk_id]
 */

import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';

const DB_DIR = process.env.DB_DIR || './app_data';
const DB_PATH = path.resolve(DB_DIR, 'portal.db');
const ADMIN_CLERK_ID = process.argv.includes('--admin')
  ? process.argv[process.argv.indexOf('--admin') + 1]
  : 'admin_sarah';

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Verify admin exists
const adminUser = db.prepare('SELECT clerk_id, email FROM users WHERE clerk_id = ?').get(ADMIN_CLERK_ID);
if (!adminUser) {
  console.error(`Admin user '${ADMIN_CLERK_ID}' not found. Available users:`);
  const users = db.prepare('SELECT clerk_id, email FROM users').all();
  for (const u of users) console.error(`  ${u.clerk_id}  ${u.email}`);
  db.close();
  process.exit(1);
}
console.log(`Admin: ${ADMIN_CLERK_ID} (${adminUser.email})`);

// Discover existing tables
const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);

// Order: users last so the admin isn't deleted before child rows
const usersTable = 'users';
const tables = allTables.filter(t => t !== usersTable).concat([usersTable]);

// Disable foreign keys for safe unordered deletion
db.pragma('foreign_keys = OFF');

const transaction = db.transaction(() => {
  let totalDeleted = 0;
  for (const table of tables) {
    if (table === usersTable) {
      const result = db.prepare('DELETE FROM users WHERE clerk_id != ?').run(ADMIN_CLERK_ID);
      console.log(`  users: ${result.changes} row(s) deleted, admin preserved`);
      totalDeleted += result.changes;
    } else {
      const result = db.prepare(`DELETE FROM "${table}"`).run();
      if (result.changes > 0) {
        console.log(`  ${table}: ${result.changes} row(s) deleted`);
      }
      totalDeleted += result.changes;
    }
  }
  console.log(`\nTotal rows deleted: ${totalDeleted}`);
});

transaction();
db.pragma('foreign_keys = ON');

// Verify
const remainingUsers = db.prepare('SELECT clerk_id FROM users').all();
const rowCounts = tables.map(t => {
  const r = db.prepare(`SELECT COUNT(*) as cnt FROM "${t}"`).get();
  return `  ${t}: ${r.cnt} rows`;
});

console.log(`\nPost-cleanup state:`);
console.log(rowCounts.join('\n'));

db.close();
console.log('Done.');
