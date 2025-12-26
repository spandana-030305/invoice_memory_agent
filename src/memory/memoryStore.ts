import sqlite3 from "sqlite3";
import path from "path";

// Database Path
const DB_PATH = path.join(__dirname, "../../memory.db");

// Database connection
export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite DB", err);
  } else {
    console.log("Connected to SQLite memory database");
  }
});

// Table initialization function
export function initializeMemoryTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS vendor_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT,
        pattern TEXT,
        field TEXT,
        extractedFrom TEXT,
        confidence REAL,
        usageCount INTEGER,
        lastUsedAt TEXT,
        createdAt TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS correction_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT,
        issue TEXT,
        action TEXT,
        confidence REAL,
        usageCount INTEGER,
        lastUsedAt TEXT,
        createdAt TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS resolution_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT,
        decision TEXT,
        confidence REAL,
        usageCount INTEGER,
        lastUsedAt TEXT,
        createdAt TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        step TEXT,
        timestamp TEXT,
        details TEXT
      )
    `);
  });
}
