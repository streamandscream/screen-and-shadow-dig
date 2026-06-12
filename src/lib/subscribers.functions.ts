import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(100).optional(),
});

export const subscribeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => subscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscribers")
      .insert({ email: data.email, source: data.source ?? "website" });

    if (error) {
      // Unique violation — treat as success (idempotent) without revealing membership
      if (error.code === "23505") {
        return { ok: true as const };
      }
      console.error("subscribeEmail error", error);
      throw new Error("Unable to subscribe right now. Please try again later.");
    }

    return { ok: true as const };
  });
