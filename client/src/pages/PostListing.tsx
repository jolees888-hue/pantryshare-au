import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertListingSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = insertListingSchema.extend({
  contactEmail: z.string().email("Please enter a valid email address"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Please add a bit more detail").max(600),
  suburb: z.string().min(2, "Please enter your suburb"),
  postcode: z.string().regex(/^\d{4}$/, "Enter a valid 4-digit Australian postcode"),
  contactName: z.string().min(2, "Please enter your name"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PostListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "share",
      category: "pantry",
      title: "",
      description: "",
      suburb: "",
      postcode: "",
      contactName: "",
      contactEmail: "",
      swapFor: "",
    },
  });

  const watchType = form.watch("type");

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest("POST", "/api/listings", data).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      // Store delete token in localStorage so the poster can remove their own listing later
      if (data.id && data.deleteToken) {
        localStorage.setItem(`pantryshare-delete-${data.id}`, data.deleteToken);
      }
      toast({ title: "Listing posted", description: "Your listing is now visible to your community." });
      navigate(`/listing/${data.id}`);
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Back nav */}
      <Link href="/">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </button>
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Post a food listing
        </h1>
        <p className="text-muted-foreground text-sm">
          Share what you have, offer a swap, or let your neighbours know what you need.
        </p>
      </div>

      {/* Reminder banner */}
      <div className="alert-banner rounded-xl px-4 py-3 flex gap-2.5 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Only list food you genuinely have available now. Contact details are visible to anyone in your area —
          use a general email if you prefer privacy.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(v => mutation.mutate(v))}
          className="space-y-5"
          data-testid="form-post-listing"
        >
          {/* Listing type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">What are you doing?</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "share", label: "Sharing", desc: "Free to take" },
                    { value: "swap",  label: "Swapping", desc: "Trade for something" },
                    { value: "wanted",label: "Wanted", desc: "Looking for" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                        field.value === opt.value
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                      data-testid={`button-type-${opt.value}`}
                    >
                      <div className="font-bold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{opt.label}</div>
                      <div className="text-xs mt-0.5 opacity-75">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fresh_produce">Fresh Produce</SelectItem>
                    <SelectItem value="pantry">Pantry Staples (rice, pasta, tins)</SelectItem>
                    <SelectItem value="dairy">Dairy &amp; Eggs</SelectItem>
                    <SelectItem value="bakery">Bread &amp; Bakery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Listing title</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      watchType === "wanted"
                        ? "e.g. Looking for spare rice or pasta"
                        : watchType === "swap"
                        ? "e.g. 2kg basmati rice — swap for flour"
                        : "e.g. Excess zucchini from the garden"
                    }
                    {...field}
                    data-testid="input-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A bit more detail — quantity, condition, how to collect, any relevant info…"
                    rows={4}
                    {...field}
                    data-testid="input-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Swap for (conditional) */}
          {watchType === "swap" && (
            <FormField
              control={form.control}
              name="swapFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">What would you swap for?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Pasta, tinned tomatoes, flour"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-swap-for"
                    />
                  </FormControl>
                  <FormDescription>Let people know what you're looking for in return.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="suburb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Suburb</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fremantle" {...field} data-testid="input-suburb" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 6160" maxLength={4} {...field} data-testid="input-postcode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact */}
          <div className="border-t border-border pt-5 space-y-4">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Your contact details</h2>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">First name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sarah" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your email is visible to people in your suburb so they can contact you. Use a general address if you prefer.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11"
            data-testid="button-submit"
          >
            {mutation.isPending ? (
              "Posting…"
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Post listing
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
