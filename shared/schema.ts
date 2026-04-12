import { z } from "zod";

// Listing types
export type ListingType = "share" | "swap" | "wanted";
export type ListingCategory = "fresh_produce" | "pantry" | "dairy" | "bakery" | "other";

export interface Listing {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  suburb: string;
  postcode: string;
  contactName: string;
  contactEmail: string;
  swapFor: string | null;
  createdAt: number;
  isActive: number;
}

export const insertListingSchema = z.object({
  type: z.enum(["share", "swap", "wanted"]),
  category: z.enum(["fresh_produce", "pantry", "dairy", "bakery", "other"]),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(600),
  suburb: z.string().min(2),
  postcode: z.string().regex(/^\d{4}$/),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  swapFor: z.string().optional(),
});

export type InsertListing = z.infer<typeof insertListingSchema>;
