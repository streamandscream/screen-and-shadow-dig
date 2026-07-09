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

  return null;
}
