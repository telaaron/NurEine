import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'lichtblick.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export default sqlite;
