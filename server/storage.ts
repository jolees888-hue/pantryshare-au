import fs from "fs";
import path from "path";
import { type InsertListing, type Listing } from "@shared/schema";
import crypto from "crypto";

// Pure JSON file-based storage — no native modules, works on any host
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), "pantryshare-data.json");

interface DB {
  listings: Listing[];
  nextId: number;
}

// ─── In-memory singleton — prevents race conditions on concurrent writes ──────
let _db: DB | null = null;
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function getDB(): DB {
  if (!_db) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        _db = JSON.parse(raw);
      }
    } catch {}
    if (!_db) _db = { listings: [], nextId: 1 };
  }
  return _db;
}

function scheduleSave() {
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => {
    if (_db) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(_db, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to save DB:", e);
      }
    }
  }, 200); // debounce — flush 200ms after last write
}

export interface IStorage {
  getListings(filters?: { suburb?: string; postcode?: string; type?: string; category?: string }): Listing[];
  getListing(id: number): Listing | undefined;
  createListing(data: InsertListing): Listing;
  deactivateListing(id: number, deleteToken: string): boolean;
}

export const storage: IStorage = {
  getListings(filters = {}) {
    const db = getDB();
    return db.listings
      .filter((l) => {
        if (!l.isActive) return false;
        if (filters.suburb && !l.suburb.toLowerCase().includes(filters.suburb.toLowerCase())) return false;
        if (filters.postcode && l.postcode !== filters.postcode) return false;
        if (filters.type && l.type !== filters.type) return false;
        if (filters.category && l.category !== filters.category) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getListing(id) {
    const db = getDB();
    return db.listings.find((l) => l.id === id && l.isActive === 1);
  },

  createListing(data) {
    const db = getDB();
    const listing: Listing = {
      id: db.nextId++,
      type: data.type,
      category: data.category,
      title: data.title,
      description: data.description,
      suburb: data.suburb,
      postcode: data.postcode,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      swapFor: data.swapFor ?? null,
      createdAt: Date.now(),
      isActive: 1,
      deleteToken: crypto.randomUUID(),
    };
    db.listings.push(listing);
    scheduleSave();
    return listing;
  },

  deactivateListing(id, deleteToken) {
    const db = getDB();
    const listing = db.listings.find((l) => l.id === id);
    if (!listing) return false;
    if (listing.deleteToken !== deleteToken) return false;
    listing.isActive = 0;
    scheduleSave();
    return true;
  },
};
