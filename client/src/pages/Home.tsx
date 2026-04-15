import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { type Listing } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Search,
  MapPin,
  Leaf,
  Package,
  Milk,
  Wheat,
  Box,
  ArrowRight,
  Users,
  RefreshCw,
  Heart,
  Wind,
  X,
} from "lucide-react";

// ── Cyclone Narelle priority zones ──────────────────────────────────────────
const NARELLE_ZONES = [
  { label: "Exmouth",    postcode: "6707", suburb: "Exmouth"  },
  { label: "Carnarvon",  postcode: "6701", suburb: "Carnarvon" },
  { label: "Shark Bay",  postcode: "6537", suburb: "Denham"   },
];

const NARELLE_POSTCODES = new Set(NARELLE_ZONES.map(z => z.postcode));

/** Sort listings so Narelle-affected postcodes always appear first */
function sortWithNarellePriority(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    const aPriority = NARELLE_POSTCODES.has(a.postcode) ? 0 : 1;
    const bPriority = NARELLE_POSTCODES.has(b.postcode) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.createdAt - a.createdAt; // newest first within each group
  });
}

// ── Type / category maps ─────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  share:  { label: "Sharing", className: "badge-share"  },
  swap:   { label: "Swap",    className: "badge-swap"   },
  wanted: { label: "Wanted",  className: "badge-wanted" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fresh_produce: <Leaf  className="w-3.5 h-3.5" />,
  pantry:        <Package className="w-3.5 h-3.5" />,
  dairy:         <Milk  className="w-3.5 h-3.5" />,
  bakery:        <Wheat className="w-3.5 h-3.5" />,
  other:         <Box   className="w-3.5 h-3.5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  fresh_produce: "Fresh Produce",
  pantry:        "Pantry Staples",
  dairy:         "Dairy & Eggs",
  bakery:        "Bread & Bakery",
  other:         "Other",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Listing card ─────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: Listing }) {
  const type = TYPE_LABELS[listing.type] ?? TYPE_LABELS.share;
  const isNarelle = NARELLE_POSTCODES.has(listing.postcode);
  return (
    <Link href={`/listing/${listing.id}`}>
      <div
        className="listing-card bg-card border border-border rounded-xl p-4 cursor-pointer h-full flex flex-col gap-3"
        data-testid={`listing-card-${listing.id}`}
        style={isNarelle ? { borderColor: "rgba(201,124,42,0.45)" } : undefined}
      >
        {/* Narelle priority tag */}
        {isNarelle && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.7rem", fontWeight: 700, color: "#c97c2a",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            <Wind size={11} />
            Cyclone Narelle area
          </div>
        )}
        {/* Type + category badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${type.className}`}>
            {type.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {CATEGORY_ICONS[listing.category]}
            {CATEGORY_LABELS[listing.category]}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          {listing.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {listing.description}
        </p>

        {/* Swap for */}
        {listing.type === "swap" && listing.swapFor && (
          <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <span className="font-semibold">Swap for:</span> {listing.swapFor}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{listing.suburb}, {listing.postcode}</span>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between pt-1 border-t border-border">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [suburb, setSuburb]     = useState("");
  const [postcode, setPostcode] = useState("");
  const [type, setType]         = useState("all");
  const [category, setCategory] = useState("all");
  const [activeFilters, setActiveFilters] = useState<{
    suburb?: string; postcode?: string; type?: string; category?: string;
  }>({});
  const [narelleOpen, setNarelleOpen] = useState(true);

  const { data: rawListings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", activeFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeFilters.suburb)   params.set("suburb",   activeFilters.suburb);
      if (activeFilters.postcode) params.set("postcode", activeFilters.postcode);
      if (activeFilters.type && activeFilters.type !== "all")         params.set("type",     activeFilters.type);
      if (activeFilters.category && activeFilters.category !== "all") params.set("category", activeFilters.category);
      return apiRequest("GET", `/api/listings?${params.toString()}`).then(r => r.json());
    },
  });

  // Apply Narelle priority sort unless the user has filtered by a specific area
  const listings = rawListings
    ? (Object.keys(activeFilters).length === 0 ? sortWithNarellePriority(rawListings) : rawListings)
    : undefined;

  function handleSearch() {
    setActiveFilters({
      suburb:   suburb.trim()   || undefined,
      postcode: postcode.trim() || undefined,
      type:     type     !== "all" ? type     : undefined,
      category: category !== "all" ? category : undefined,
    });
  }

  function handleReset() {
    setSuburb(""); setPostcode(""); setType("all"); setCategory("all");
    setActiveFilters({});
  }

  function jumpToZone(zone: typeof NARELLE_ZONES[0]) {
    setSuburb(zone.suburb);
    setPostcode(zone.postcode);
    setActiveFilters({ suburb: zone.suburb, postcode: zone.postcode });
  }

  const hasFilters = suburb || postcode || type !== "all" || category !== "all";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ── CYCLONE NARELLE BANNER ── */}
      {narelleOpen && (
        <div
          role="alert"
          style={{
            background: "linear-gradient(135deg, #3a2010 0%, #2e1c0a 100%)",
            border: "1px solid rgba(201,124,42,0.4)",
            borderRadius: "0.875rem",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.875rem",
            alignItems: "flex-start",
            position: "relative",
          }}
        >
          <Wind style={{ width: 20, height: 20, color: "#c97c2a", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "#f5f0e8", marginBottom: "0.3rem" }}>
              Cyclone Narelle recovery — priority support active
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.75)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              We're starting in the communities most affected by Cyclone Narelle — Exmouth, Carnarvon and Shark Bay — to support local families, growers and small businesses as they rebuild.
              Listings from these areas appear first.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {NARELLE_ZONES.map(z => (
                <button
                  key={z.postcode}
                  onClick={() => jumpToZone(z)}
                  style={{
                    background: "rgba(201,124,42,0.2)",
                    border: "1px solid rgba(201,124,42,0.4)",
                    borderRadius: 99,
                    padding: "0.3rem 0.85rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#e8a84a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <MapPin size={11} />
                  {z.label} ({z.postcode})
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setNarelleOpen(false)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", color: "rgba(245,240,232,0.4)", cursor: "pointer", padding: "0.15rem", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Food for your community,<br className="hidden sm:block" /> from your community.
        </h1>
        <p className="text-muted-foreground text-base max-w-xl">
          Browse food available to share or swap in your suburb. No money changes hands — just neighbours looking after neighbours.
        </p>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Users className="w-4 h-4" />,    label: "Households sharing", value: listings ? listings.length + 12 : "—" },
          { icon: <RefreshCw className="w-4 h-4" />, label: "Active listings",    value: listings ? listings.length : "—" },
          { icon: <Heart className="w-4 h-4" />,     label: "Suburbs active",     value: listings ? new Set(listings.map(l => l.postcode)).size + 3 : "—" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <div className="flex justify-center text-primary mb-1">{s.icon}</div>
            <div className="font-bold text-xl" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SEARCH / FILTERS ── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Find food near you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Suburb name (e.g. Exmouth)"
            value={suburb}
            onChange={e => setSuburb(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            data-testid="input-suburb"
          />
          <Input
            placeholder="Postcode (e.g. 6707)"
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            data-testid="input-postcode"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="select-type"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="share">Sharing</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
              <SelectItem value="wanted">Wanted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="select-category"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="fresh_produce">Fresh Produce</SelectItem>
              <SelectItem value="pantry">Pantry Staples</SelectItem>
              <SelectItem value="dairy">Dairy &amp; Eggs</SelectItem>
              <SelectItem value="bakery">Bread &amp; Bakery</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-search">
            <Search className="w-4 h-4" />
            Search my area
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={handleReset} data-testid="button-reset">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── LISTINGS GRID ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {Object.keys(activeFilters).length > 0 ? "Results" : "Latest listings — Narelle areas first"}
          </h2>
          <Link href="/post">
            <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-post-cta">
              + Add yours
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground text-base">No listings found in this area yet.</p>
            <p className="text-muted-foreground text-sm">Be the first to share something in your suburb.</p>
            <Link href="/post">
              <Button className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                Post the first listing
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="border-t border-border pt-8 space-y-4">
        <h2 className="font-bold text-lg" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Post what you have",    desc: "List food you can share, or items you're willing to swap. Fresh produce, rice, pasta, tins — anything helps." },
            { step: "02", title: "Or ask for what you need", desc: "Post a 'Wanted' listing so neighbours know what your household is short on." },
            { step: "03", title: "Connect directly",       desc: "Contact the person directly by email. Arrange collection at your doorstep. No money, no middleman." },
          ].map(s => (
            <div key={s.step} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{s.step}</span>
              <h3 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
