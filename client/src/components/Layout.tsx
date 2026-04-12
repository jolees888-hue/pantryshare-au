import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Sun, Moon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Logo SVG — stylised pantry shelf / sharing hands mark
function Logo() {
  return (
    <svg
      aria-label="PantryShare AU"
      viewBox="0 0 36 36"
      fill="none"
      className="w-8 h-8 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pantry shelf base */}
      <rect x="4" y="26" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
      {/* Jar left */}
      <rect x="6" y="17" width="6" height="9" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="7" y="15" width="4" height="3" rx="1" fill="currentColor" opacity="0.5" />
      {/* Tin middle */}
      <rect x="15" y="19" width="6" height="7" rx="1.5" fill="currentColor" opacity="0.85" />
      <ellipse cx="18" cy="19" rx="3" ry="1" fill="currentColor" opacity="0.6" />
      {/* Jar right */}
      <rect x="24" y="16" width="6" height="10" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="25" y="14" width="4" height="3" rx="1" fill="currentColor" opacity="0.5" />
      {/* Sharing arc above */}
      <path d="M10 13 Q18 7 26 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo + wordmark */}
          <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity">
            <Logo />
            <div>
              <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                PantryShare
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-medium">AU</span>
            </div>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            {location !== "/" && (
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1.5" data-testid="nav-browse">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Browse</span>
                </Button>
              </Link>
            )}
            <Link href="/post">
              <Button
                size="sm"
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="nav-post"
              >
                <Plus className="w-4 h-4" />
                <span>Post Food</span>
              </Button>
            </Link>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="theme-toggle"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Logo />
            <span>PantryShare AU</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Community food sharing, suburb by suburb. Built for Australians by Australians.
          </p>
        </div>
      </footer>
    </div>
  );
}
