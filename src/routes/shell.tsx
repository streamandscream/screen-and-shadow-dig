import { createFileRoute } from "@tanstack/react-router";

// Internal SPA shell route. Used only at build time to generate the Apache
// fallback document (spa.html). It is stripped from the deployed output and
// the sitemap by scripts/finalize-static.mjs.
export const Route = createFileRoute("/shell")({
  head: () => ({
    meta: [
      { title: "Stream & Scream" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <div />,
});
