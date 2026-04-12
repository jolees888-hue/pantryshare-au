import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertListingSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {
  // Get all listings with optional filters
  app.get("/api/listings", (req, res) => {
    try {
      const { suburb, postcode, type, category } = req.query;
      const results = storage.getListings({
        suburb: suburb as string | undefined,
        postcode: postcode as string | undefined,
        type: type as string | undefined,
        category: category as string | undefined,
      });
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Get single listing
  app.get("/api/listings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const listing = storage.getListing(id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  });

  // Create a listing
  app.post("/api/listings", (req, res) => {
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

  // Seed some example listings for demo purposes
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
