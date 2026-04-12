import Database from "better-sqlite3";
import { listings, type InsertListing, type Listing } from "@shared/schema";

// Use file-based SQLite — works on Hostinger persistent storage
const DB_PATH = process.env.DB_PATH || "pantryshare.db";
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suburb TEXT NOT NULL,
    postcode TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    swap_for TEXT,
    created_at INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  )
`);

export interface IStorage {
  getListings(filters?: { suburb?: string; postcode?: string; type?: string; category?: string }): Listing[];
  getListing(id: number): Listing | undefined;
  createListing(data: InsertListing): Listing;
  deactivateListing(id: number): void;
}

function rowToListing(row: any): Listing {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    description: row.description,
    suburb: row.suburb,
    postcode: row.postcode,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    swapFor: row.swap_for ?? null,
    createdAt: row.created_at,
    isActive: row.is_active,
  };
}

export const storage: IStorage = {
  getListings(filters = {}) {
    let sql = "SELECT * FROM listings WHERE is_active = 1";
    const params: any[] = [];

    if (filters.suburb) {
      sql += " AND LOWER(suburb) LIKE LOWER(?)";
      params.push(`%${filters.suburb}%`);
    }
    if (filters.postcode) {
      sql += " AND postcode = ?";
      params.push(filters.postcode);
    }
    if (filters.type) {
      sql += " AND type = ?";
      params.push(filters.type);
    }
    if (filters.category) {
      sql += " AND category = ?";
      params.push(filters.category);
    }

    sql += " ORDER BY created_at DESC";

    const rows = sqlite.prepare(sql).all(...params) as any[];
    return rows.map(rowToListing);
  },

  getListing(id) {
    const row = sqlite.prepare("SELECT * FROM listings WHERE id = ? AND is_active = 1").get(id) as any;
    return row ? rowToListing(row) : undefined;
  },

  createListing(data) {
    const stmt = sqlite.prepare(`
      INSERT INTO listings (type, category, title, description, suburb, postcode, contact_name, contact_email, swap_for, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      data.type,
      data.category,
      data.title,
      data.description,
      data.suburb,
      data.postcode,
      data.contactName,
      data.contactEmail,
      data.swapFor ?? null,
      Date.now()
    );
    return this.getListing(result.lastInsertRowid as number)!;
  },

  deactivateListing(id) {
    sqlite.prepare("UPDATE listings SET is_active = 0 WHERE id = ?").run(id);
  },
};
