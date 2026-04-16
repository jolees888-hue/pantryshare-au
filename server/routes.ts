import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";
import { z } from "zod";

// ─── In-memory rate limiter (no npm package needed) ───────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count++;
  rateLimitMap.set(ip, record);
  return record.count > maxRequests;
}

// ─── Query param validation schema ────────────────────────────────────────────
const listingsQuerySchema = z.object({
  suburb: z.string().max(100).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  type: z.enum(["share", "swap", "wanted"]).optional(),
  category: z
    .enum(["fresh_produce", "pantry", "bakery", "dairy", "other"])
    .optional(),
});

// ─── Email masking helper ─────────────────────────────────────────────────────
function maskListing(listing: Record<string, unknown>) {
  const { contactEmail, ...safe } = listing;
  return safe;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Get all listings with optional filters
  app.get("/api/listings", (req, res) => {
    try {
      const parsed = listingsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid query parameters", details: parsed.error.errors });
      }
      const { suburb, postcode, type, category } = parsed.data;
      const results = storage.getListings({ suburb, postcode, type, category });
      // Strip contact emails from public response
      const safe = (results as Record<string, unknown>[]).map(maskListing);
      res.json(safe);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Get single listing — also mask email
  app.get("/api/listings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const listing = storage.getListing(id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(maskListing(listing as Record<string, unknown>));
  });

  // Create a listing — rate limited
  app.post("/api/listings", (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    if (rateLimit(ip)) {
      return res.status(429).json({ error: "Too many requests — please wait a minute and try again." });
    }
    try {
      const data = insertListingSchema.parse(req.body);
      const listing = storage.createListing(data);
      res.status(201).json(listing);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.errors });
      }
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // Deactivate / remove a listing
  app.delete("/api/listings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    storage.deactivateListing(id);
    res.json({ ok: true });
  });

  // Seed endpoint — development only, blocked in production
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/seed", (_req, res) => {
      const seeds = [
        { type: "share", category: "fresh_produce", title: "Excess zucchini from the garden", description: "Too many zucchinis! Happy to share a bag with anyone in the suburb. Just knock on my door.", suburb: "East Fremantle", postcode: "6158", contactName: "Sarah M", contactEmail: "sarah@example.com", swapFor: null },
        { type: "swap", category: "pantry", title: "2kg bag of basmati rice", description: "Happy to swap for pasta, flour, or tinned tomatoes.", suburb: "Fremantle", postcode: "6160", contactName: "James K", contactEmail: "james@example.com", swapFor: "Pasta or tinned tomatoes" },
        { type: "share", category: "bakery", title: "Sourdough loaves — baked fresh this morning", description: "I baked 3 extra loaves. Free to a good home, first come first served.", suburb: "North Fremantle", postcode: "6159", contactName: "Lena W", contactEmail: "lena@example.com", swapFor: null },
        { type: "wanted", category: "fresh_produce", title: "Looking for any spare citrus", description: "Three kids at home, would love any spare oranges or lemons if anyone has a tree going crazy.", suburb: "Palmyra", postcode: "6157", contactName: "Dave R", contactEmail: "dave@example.com", swapFor: null },
        { type: "share", category: "dairy", title: "Fresh eggs from our backyard chickens", description: "We have 6 hens and more eggs than we can eat. A dozen available this week.", suburb: "Bicton", postcode: "6157", contactName: "Anna T", contactEmail: "anna@example.com", swapFor: null },
        { type: "swap", category: "pantry", title: "Oats — 1kg pack unopened", description: "We bought too many oats. Looking to swap for anything useful — flour, sugar, tinned goods.", suburb: "Melville", postcode: "6156", contactName: "Chris B", contactEmail: "chris@example.com", swapFor: "Flour, sugar, or tinned goods" },
      ];
      for (const s of seeds) {
        storage.createListing({ ...s, swapFor: s.swapFor ?? undefined } as any);
      }
      res.json({ ok: true, count: seeds.length });
    });
  }
}
