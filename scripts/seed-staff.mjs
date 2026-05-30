#!/usr/bin/env node

/**
 * Seed a staff user (admin or staff/admin) by email.
 *
 * Usage:
 *   node scripts/seed-staff.mjs <email> [role]
 *
 * Examples:
 *   node scripts/seed-staff.mjs staff@example.com
 *   node scripts/seed-staff.mjs admin@example.com admin
 *
 * Role defaults to 'staff'. Valid roles: admin or staff, admin.
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const email = process.argv[2];
const role = process.argv[3] || 'staff';

if (!email) {
  console.error('Usage: node scripts/seed-staff.mjs <email> [role]');
  process.exit(1);
}

if (!['staff', 'admin'].includes(role)) {
  console.error(`Invalid role "${role}". Valid roles: admin or staff, admin`);
  process.exit(1);
}

// Resolve the local database
const dbDir = process.env.DB_DIR || './app_data';
const dbPath = path.resolve(dbDir, 'portal.db');

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  console.error('Make sure the dev server has been started at least once to create the database.');
  process.exit(1);
}

const db = new Database(dbPath);

// Check if user exists
const user = db.prepare('SELECT clerk_id, email, name, role FROM users WHERE email = ?').get(email);

if (!user) {
  // If no user exists yet, the person needs to sign up with Clerk first
  // so that upsertUser() creates their row. But we can let them know.
  console.error(`No user found with email "${email}".`);
  console.error('The staff member must sign up via Clerk first (this creates their user record).');
  console.error('After they sign in once, re-run this script to promote them.');
  db.close();
  process.exit(1);
}

const oldRole = user.role;
db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email);
db.close();

console.log(`✅ Promoted "${email}" from "${oldRole}" → "${role}"`);
console.log(`   Clerk ID: ${user.clerk_id}`);
console.log(`   Name:     ${user.name || '(not set)'}`);
