import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

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
      const skimHosts = /(^|\.)(skimresources\.com|redirectingat\.com)$/i;
      const affiliateHosts = /(^|\.)(skimresources\.com|go\.redirectingat\.com|redirectingat\.com|amzn\.to|amazon\.[a-z.]+\/.*tag=)/i;
      const isAffiliate = affiliateHosts.test(url.hostname) || /[?&](tag|utm_source|impactId|irclickid|clickref)=/i.test(url.search);

      // Extract Skimlinks merchant ID + original destination when the link has been transformed.
      let merchantId: string | null = null;
      let originalUrl: string | null = null;
      if (skimHosts.test(url.hostname)) {
        merchantId = url.searchParams.get("id");
        const inner = url.searchParams.get("url") || url.searchParams.get("xs");
        if (inner) {
          try {
            originalUrl = new URL(inner).href;
          } catch {
            originalUrl = inner;
          }
        }
      } else {
        // Skimlinks may attach the original href as a data attribute before intercepting.
        const dataOriginal =
          anchor.getAttribute("data-skimlinks-original-url") ||
          anchor.getAttribute("data-vars-outbound-url");
        if (dataOriginal) originalUrl = dataOriginal;
      }

      // Fire-and-forget log to our own analytics table
      try {
        const payload = JSON.stringify({
          url: url.href,
          link_text: linkText,
          source_path: window.location.pathname + window.location.search,
          is_affiliate: isAffiliate,
          merchant_id: merchantId,
          original_url: originalUrl,
        });
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/public/track/outbound-click", blob);
        } else {
          fetch("/api/public/track/outbound-click", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // ignore
      }

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
