import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Match the canonical URLs emitted by metadata, the sitemap, and Hostinger.
    // This also makes every generated <Link> point straight to the final URL
    // instead of sending crawlers through a redirect first.
    trailingSlash: "always",
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Ships the server/prerender query cache into the HTML so the first client
  // render has the same data. Without this, useSuspenseQuery suspends during
  // hydration and React throws away the prerendered markup (blank screen).
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
