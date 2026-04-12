import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, like, desc } from "drizzle-orm";
import { listings, type InsertListing, type Listing } from "@shared/schema";

const sqlite = new Database("suburbshare.db");
export const db = drizzle(sqlite);

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

export const storage: IStorage = {
  getListings(filters = {}) {
    let query = db.select().from(listings).where(eq(listings.isActive, 1));
    const results = db
      .select()
      .from(listings)
      .where(eq(listings.isActive, 1))
      .orderBy(desc(listings.createdAt))
      .all();

    return results.filter((l) => {
      if (filters.suburb && !l.suburb.toLowerCase().includes(filters.suburb.toLowerCase())) return false;
      if (filters.postcode && l.postcode !== filters.postcode) return false;
      if (filters.type && l.type !== filters.type) return false;
      if (filters.category && l.category !== filters.category) return false;
      return true;
    });
  },

  getListing(id) {
    return db.select().from(listings).where(eq(listings.id, id)).get();
  },

  createListing(data) {
    return db
      .insert(listings)
      .values({ ...data, createdAt: Date.now(), isActive: 1 })
      .returning()
      .get();
  },

  deactivateListing(id) {
    db.update(listings).set({ isActive: 0 }).where(eq(listings.id, id)).run();
  },
};
