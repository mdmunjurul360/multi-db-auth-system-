// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      // Manual vendor chunks: split big third-party libs into long-cached
      // chunks so a code change in app source doesn't invalidate vendor JS.
      // Initial parse cost also drops because chunks load in parallel.
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (id.includes("@tanstack/react-table")) return "vendor-table";
            if (id.includes("@tanstack/")) return "vendor-tanstack";
            if (id.includes("@supabase/") || id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@radix-ui/")) return "vendor-radix";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) return "vendor-forms";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("date-fns") || id.includes("dayjs")) return "vendor-date";
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("scheduler")) return "vendor-react";
          },
        },
      },
    },
  },
});
