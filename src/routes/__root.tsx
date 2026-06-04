import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteLoader } from "@/components/SiteLoader";
import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Book Botbari" },
      { name: "description", content: "Figma Admin Delight is a web application that faithfully recreates a Figma-designed admin panel interface." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Book Botbari" },
      { property: "og:description", content: "Figma Admin Delight is a web application that faithfully recreates a Figma-designed admin panel interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Book Botbari" },
      { name: "twitter:description", content: "Figma Admin Delight is a web application that faithfully recreates a Figma-designed admin panel interface." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0435ab55-d16b-44ae-8806-c99a78dbdeb2/id-preview-32714331--85244456-7082-49ff-adb6-0694f17faf90.lovable.app-1778333532249.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0435ab55-d16b-44ae-8806-c99a78dbdeb2/id-preview-32714331--85244456-7082-49ff-adb6-0694f17faf90.lovable.app-1778333532249.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Preconnect to Supabase: shaves ~100–250ms off the first books query / image fetch.
      { rel: "preconnect", href: "https://fohfjkipiqnxeypleecq.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://fohfjkipiqnxeypleecq.supabase.co" },
      // Google Fonts: preconnect + subsetted load with display=swap (no FOIT, no CLS).
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteLoader />
        <GlobalRealtimeSync />
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>

  );
}

/**
 * Single source-of-truth realtime listener. Invalidates Query cache keys
 * whenever the underlying Supabase tables change. Replaces per-component
 * Supabase channels (which collided under React StrictMode).
 */
function GlobalRealtimeSync() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const tables = ["books", "orders", "order_items", "wishlist", "notifications", "profiles"] as const;
    const channel = supabase.channel("global-sync");
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => queryClient.invalidateQueries({ queryKey: [table] }),
      );
    }
    channel.subscribe();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Skip TOKEN_REFRESHED / USER_UPDATED — these fire often and would
      // wipe the entire query cache, causing visible refetch slowdowns.
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      queryClient.invalidateQueries();
      router.invalidate();
    });

    return () => {
      supabase.removeChannel(channel);
      sub.subscription.unsubscribe();
    };
  }, [queryClient, router]);

  return null;
}
