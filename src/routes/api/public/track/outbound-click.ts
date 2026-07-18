import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track/outbound-click")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null) as
            | { url?: string; link_text?: string; source_path?: string; is_affiliate?: boolean }
            | null;
          if (!body || typeof body.url !== "string") {
            return new Response(JSON.stringify({ ok: false, error: "invalid" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
          let parsed: URL;
          try {
            parsed = new URL(body.url);
          } catch {
            return new Response(JSON.stringify({ ok: false, error: "bad_url" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
          if (!/^https?:$/.test(parsed.protocol)) {
            return new Response(JSON.stringify({ ok: false, error: "bad_proto" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("outbound_clicks").insert({
            url: parsed.href.slice(0, 2000),
            domain: parsed.hostname,
            link_text: (body.link_text ?? "").slice(0, 200) || null,
            source_path: (body.source_path ?? "").slice(0, 500) || null,
            is_affiliate: Boolean(body.is_affiliate),
            user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300) || null,
          });
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          console.error("[track/outbound-click]", e);
          return new Response(JSON.stringify({ ok: false }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
