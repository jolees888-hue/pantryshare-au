import fs from "fs";
import path from "path";
import { type InsertListing, type Listing } from "@shared/schema";

// Pure JSON file-based storage — no native modules, works on any host
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), "pantryshare-data.json");

interface DB {
  listings: Listing[];
  nextId: number;
}

function loadDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return { listings: [], nextId: 1 };
}

function saveDB(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save DB:", e);
  }
}

export interface IStorage {
  getListings(filters?: { suburb?: string; postcode?: string; type?: string; category?: string }): Listing[];
  getListing(id: number): Listing | undefined;
  createListing(data: InsertListing): Listing;
  deactivateListing(id: number): void;
}

export const storage: IStorage = {
  getListings(filters = {}) {
    const db = loadDB();
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
    const db = loadDB();
    return db.listings.find((l) => l.id === id && l.isActive === 1);
  },

  createListing(data) {
    const db = loadDB();
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
    };
    db.listings.push(listing);
    saveDB(db);
    return listing;
  },

  deactivateListing(id) {
    const db = loadDB();
    const listing = db.listings.find((l) => l.id === id);
    if (listing) {
      listing.isActive = 0;
      saveDB(db);
    }
  },
};
