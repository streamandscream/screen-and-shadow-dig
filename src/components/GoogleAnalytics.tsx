import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-8FX8SSZTCT";

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, string | number | boolean | undefined>,
    ) => void;
    dataLayer?: unknown[];
  }
}

export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

    window.gtag("config", GA_ID, {
      page_path: location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Only track external http(s) links
      if (!/^https?:$/.test(url.protocol)) return;
      if (url.hostname === window.location.hostname) return;

      const linkText = (anchor.textContent || "").trim().slice(0, 100);
      const affiliateHosts = /(^|\.)(amzn\.to|amazon\.[a-z.]+\/.*tag=)/i;
      const isAffiliate = affiliateHosts.test(url.hostname) || /[?&](tag|utm_source|impactId|irclickid|clickref)=/i.test(url.search);

      if (!window.gtag) return;
      window.gtag("event", "click", {
        event_category: "outbound",
        event_label: url.href,
        link_url: url.href,
        link_domain: url.hostname,
        link_text: linkText,
        outbound: true,
        is_affiliate: isAffiliate,
        transport_type: "beacon",
      });

    };

    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true } as EventListenerOptions);
  }, []);

  return null;
}
