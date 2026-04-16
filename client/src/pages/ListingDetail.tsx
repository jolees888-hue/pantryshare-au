import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Listing } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Mail,
  User,
  Clock,
  Leaf,
  Package,
  Milk,
  Wheat,
  Box,
  Trash2,
  RefreshCw,
} from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; className: string; description: string }> = {
  share:  { label: "Sharing",  className: "badge-share",  description: "This food is free to take — no exchange needed." },
  swap:   { label: "Swap",     className: "badge-swap",   description: "This person would like to swap for something in return." },
  wanted: { label: "Wanted",   className: "badge-wanted", description: "This household is looking for this food item." },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fresh_produce: <Leaf className="w-4 h-4" />,
  pantry:        <Package className="w-4 h-4" />,
  dairy:         <Milk className="w-4 h-4" />,
  bakery:        <Wheat className="w-4 h-4" />,
  other:         <Box className="w-4 h-4" />,
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
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

export default function ListingDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["/api/listings", id],
    queryFn: () => apiRequest("GET", `/api/listings/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const deleteToken = id ? localStorage.getItem(`pantryshare-delete-${id}`) : null;

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deleteToken) throw new Error("No delete token — you can only remove your own listings.");
      return apiRequest("DELETE", `/api/listings/${id}?token=${encodeURIComponent(deleteToken)}`).then(r => r.json());
    },
    onSuccess: () => {
      if (id) localStorage.removeItem(`pantryshare-delete-${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Listing removed", description: "Your listing has been taken down." });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: "Could not remove listing", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-muted-foreground">This listing could not be found or has been removed.</p>
        <Link href="/">
          <Button variant="outline">Back to listings</Button>
        </Link>
      </div>
    );
  }

  const type = TYPE_LABELS[listing.type] ?? TYPE_LABELS.share;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Back */}
      <Link href="/">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
          All listings
        </button>
      </Link>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${type.className}`}>
          {type.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {CATEGORY_ICONS[listing.category]}
          {CATEGORY_LABELS[listing.category]}
        </span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1
          className="text-2xl font-extrabold tracking-tight text-foreground leading-tight"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          data-testid="text-title"
        >
          {listing.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {listing.suburb}, {listing.postcode}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(listing.createdAt)}
          </span>
        </div>
      </div>

      {/* Type explanation */}
      <div className="alert-banner rounded-xl px-4 py-3 text-sm">
        {type.description}
      </div>

      {/* Description */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Details</h2>
        <p className="text-base text-foreground whitespace-pre-wrap" data-testid="text-description">
          {listing.description}
        </p>
      </div>

      {/* Swap for */}
      {listing.type === "swap" && listing.swapFor && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-2">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Looking to swap for
          </h2>
          <p className="text-base text-foreground">{listing.swapFor}</p>
        </div>
      )}

      {/* Contact card */}
      <div className="bg-primary/6 border border-primary/20 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-primary">Contact this person</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <User className="w-4 h-4 text-muted-foreground" />
            <span data-testid="text-contact-name">{listing.contactName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a
              href={`mailto:${listing.contactEmail}?subject=PantryShare AU — ${encodeURIComponent(listing.title)}&body=Hi ${encodeURIComponent(listing.contactName)},%0A%0AI saw your listing on PantryShare AU and I'm interested in "${encodeURIComponent(listing.title)}".%0A%0A`}
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              data-testid="link-contact-email"
            >
              {listing.contactEmail}
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click the email address to contact them directly. Arrange collection at a time that suits you both.
        </p>
        <a
          href={`mailto:${listing.contactEmail}?subject=PantryShare AU — ${encodeURIComponent(listing.title)}&body=Hi ${encodeURIComponent(listing.contactName)},%0A%0AI saw your listing on PantryShare AU and I'm interested in "${encodeURIComponent(listing.title)}".%0A%0A`}
        >
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" data-testid="button-contact">
            <Mail className="w-4 h-4" />
            Email {listing.contactName}
          </Button>
        </a>
      </div>

      {/* Remove listing */}
      <div className="border-t border-border pt-5">
        <p className="text-xs text-muted-foreground mb-3">
          Is this your listing? Remove it once the food has been claimed.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => {
            if (!deleteToken) {
              toast({ title: "Not your listing", description: "You can only remove listings you posted.", variant: "destructive" });
              return;
            }
            if (confirm("Remove this listing? This cannot be undone.")) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending || !deleteToken}
          data-testid="button-remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleteMutation.isPending ? "Removing…" : "Remove this listing"}
        </Button>
      </div>
    </div>
  );
}
