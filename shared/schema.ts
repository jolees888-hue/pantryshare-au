import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "share" | "swap" | "wanted"
  category: text("category").notNull(), // "fresh_produce" | "pantry" | "dairy" | "bakery" | "other"
  title: text("title").notNull(),
  description: text("description").notNull(),
  suburb: text("suburb").notNull(),
  postcode: text("postcode").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  swapFor: text("swap_for"), // only for type=swap
  createdAt: integer("created_at").notNull(),
  isActive: integer("is_active").notNull().default(1),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
