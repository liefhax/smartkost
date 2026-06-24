import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'smartkost.db'));

// Enable WAL mode for better performance & ngurangin wear-out disk
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS energy_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    wattage REAL NOT NULL,
    voltage REAL NOT NULL,
    ampere REAL NOT NULL,
    kwh REAL NOT NULL,
    cost_rupiah REAL NOT NULL
  );

  -- Tabel baru untuk rekapan harian (Biar load data di frontend ringan)
  CREATE TABLE IF NOT EXISTS daily_energy_summary (
    date TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
    total_kwh REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    peak_watt REAL DEFAULT 0,
    avg_watt REAL DEFAULT 0,
    readings_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device TEXT NOT NULL,
    action TEXT NOT NULL,
    time TEXT NOT NULL,
    days TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_energy_timestamp ON energy_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(active);
`);

const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);

insertSetting.run('overload_limit', '500');
insertSetting.run('target_temp', '26');
insertSetting.run('tarif_per_kwh', '1444.70');

export default db;