import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";
import { z } from "zod";

// ─── In-memory rate limiter (no npm package needed) ───────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Sweep expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

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

function getIp(req: any): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";
}

// ─── Query param validation schema ────────────────────────────────────────────
const listingsQuerySchema = z.object({
  suburb: z.string().max(100).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  type: z.enum(["share", "swap", "wanted"]).optional(),
  category: z.enum(["fresh_produce", "pantry", "bakery", "dairy", "other"]).optional(),
});

// ─── Route param validation ────────────────────────────────────────────────────
const idParamSchema = z.coerce.number().int().positive();

// ─── Email masking helper — strips email from public list responses ────────────
function maskListing(listing: Record<string, unknown>) {
  const { contactEmail, deleteToken, ...safe } = listing;
  return safe;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Get all listings with optional filters — contact emails stripped
  app.get("/api/listings", (req, res) => {
    try {
      const parsed = listingsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.errors });
      }
      const { suburb, postcode, type, category } = parsed.data;
      const results = storage.getListings({ suburb, postcode, type, category });
      const safe = (results as Record<string, unknown>[]).map(maskListing);
      res.json(safe);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Get single listing — contact email included so detail page can render contact button
  app.get("/api/listings/:id", (req, res) => {
    const parsed = idParamSchema.safeParse(req.params.id);
    if (!parsed.success) return res.status(400).json({ error: "Invalid listing ID" });
    const listing = storage.getListing(parsed.data);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    // Return email for contact but still strip the deleteToken
    const { deleteToken, ...safe } = listing as Record<string, unknown>;
    res.json(safe);
  });

  // Create a listing — rate limited; returns deleteToken once so poster can delete later
  app.post("/api/listings", (req, res) => {
    if (rateLimit(getIp(req))) {
      return res.status(429).json({ error: "Too many requests — please wait a minute and try again." });
    }
    try {
      const data = insertListingSchema.parse(req.body);
      const listing = storage.createListing(data);
      // Return the deleteToken to the creator — this is the only time they'll see it
      res.status(201).json({ id: listing.id, deleteToken: listing.deleteToken });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.errors });
      }
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // Delete a listing — requires deleteToken that was issued at creation time
  app.delete("/api/listings/:id", (req, res) => {
    if (rateLimit(getIp(req), 20, 60000)) {
      return res.status(429).json({ error: "Too many requests." });
    }
    const parsed = idParamSchema.safeParse(req.params.id);
    if (!parsed.success) return res.status(400).json({ error: "Invalid listing ID" });

    const token = req.query.token as string | undefined;
    if (!token) return res.status(401).json({ error: "Delete token required" });

    const ok = storage.deactivateListing(parsed.data, token);
    if (!ok) return res.status(403).json({ error: "Invalid token or listing not found" });
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
