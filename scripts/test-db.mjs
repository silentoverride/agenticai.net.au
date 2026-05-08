import Database from 'better-sqlite3';

const db = new Database('./app_data/portal.db');
const rows = db.prepare('SELECT id, user_id, title FROM reports WHERE user_id = ?').all('user_3DNEbcgkLn2lnNAEgqn9nYfkLXx');
console.log('Reports count:', rows.length);
console.log('First report:', rows[0]);
