import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Plus, Search, Download, X } from "lucide-react";
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

// Detects if app is running as installed PWA
function useIsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

export default function Layout({ children }: LayoutProps) {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [location] = useLocation();

  // PWA install prompt
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<any>(null);
  const isPWA = useIsPWA();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    // iOS — can't use beforeinstallprompt, show manual instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      // Only show on iOS Safari (not Chrome on iOS)
      const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
      if (isSafari) {
        setIsIOS(true);
        setShowInstallBanner(true);
      }
      return;
    }

    // Android/Chrome — listen for browser's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // Can't trigger programmatically on iOS — banner explains how
      return;
    }
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      deferredPrompt.current = null;
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--color-dark, #2e3822)',
            borderTop: '1px solid rgba(106,128,64,0.4)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
          }}
        >
          <img src="/icons/icon-96.png" alt="PantryShare" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#f8f4e8', lineHeight: 1.2 }}>
              Add PantryShare AU to your home screen
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(248,244,232,0.6)', marginTop: '0.2rem' }}>
              {isIOS
                ? "Tap the Share button below, then \"Add to Home Screen\""
                : "Install the app for quick access — works offline too"}
            </div>
          </div>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                background: '#c9a030',
                color: '#1e2416',
                border: 'none',
                borderRadius: 99,
                padding: '0.5rem 1rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexShrink: 0,
              }}
            >
              <Download size={14} />
              Install
            </button>
          )}
          <button
            onClick={dismissBanner}
            style={{ background: 'none', border: 'none', color: 'rgba(248,244,232,0.5)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

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
      <footer className="border-t border-border mt-16" style={{ paddingBottom: showInstallBanner ? '5rem' : undefined }}>
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Logo />
            <span>PantryShare AU</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Community food sharing, suburb by suburb. Built for Australians by Australians.
          </p>
          <a
            href="https://famineandfeast.com.au/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
