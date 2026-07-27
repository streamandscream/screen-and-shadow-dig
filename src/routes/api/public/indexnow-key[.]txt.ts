import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/indexnow-key.txt")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.INDEXNOW_KEY;
        if (!key) return new Response("Not configured", { status: 404 });
        return new Response(key, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
