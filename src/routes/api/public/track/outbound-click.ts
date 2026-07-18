import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track/outbound-click")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null) as
            | {
                url?: string;
                link_text?: string;
                source_path?: string;
                is_affiliate?: boolean;
                merchant_id?: string | null;
                original_url?: string | null;
              }
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

          let originalUrl: string | null = null;
          if (typeof body.original_url === "string" && body.original_url) {
            try {
              originalUrl = new URL(body.original_url).href.slice(0, 2000);
            } catch {
              originalUrl = body.original_url.slice(0, 2000);
            }
          }
          const merchantId =
            typeof body.merchant_id === "string" && body.merchant_id
              ? body.merchant_id.slice(0, 100)
              : null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("outbound_clicks").insert({
            url: parsed.href.slice(0, 2000),
            domain: parsed.hostname,
            link_text: (body.link_text ?? "").slice(0, 200) || null,
            source_path: (body.source_path ?? "").slice(0, 500) || null,
            is_affiliate: Boolean(body.is_affiliate),
            merchant_id: merchantId,
            original_url: originalUrl,
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
