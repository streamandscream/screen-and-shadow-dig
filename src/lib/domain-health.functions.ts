import { createServerFn } from "@tanstack/react-start";

const DOMAIN = "streamandscream.com";
const LOVABLE_IP = "185.158.133.1";
const VERIFY_HOST = `_lovable.${DOMAIN}`;

type DohAnswer = { name: string; type: number; data: string };

async function resolve(name: string, type: "A" | "TXT" | "CNAME"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { accept: "application/dns-json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { Answer?: DohAnswer[] };
    return (json.Answer ?? []).map((a) => a.data.replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

async function probe(url: string) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { status: res.status, server: res.headers.get("server") };
  } catch (e) {
    return { status: 0, server: null, error: (e as Error).message };
  }
}

export type DomainHealth = {
  domain: string;
  checkedAt: string;
  drifted: boolean;
  aRecords: string[];
  txtVerify: string[];
  httpStatus: number;
  server: string | null;
  cause: string;
  fix: string;
};

/**
 * Checks whether the custom domain has drifted away from the Lovable
 * deployment, and reports the most likely cause.
 */
export const checkDomainHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<DomainHealth> => {
    const [aRecords, txtVerify, http] = await Promise.all([
      resolve(DOMAIN, "A"),
      resolve(VERIFY_HOST, "TXT"),
      probe(`https://${DOMAIN}/`),
    ]);

    const pointsToLovable = aRecords.includes(LOVABLE_IP);
    const hasVerify = txtVerify.some((t) => t.includes("lovable_verify"));
    const serving = http.status >= 200 && http.status < 400;

    let cause = "Everything looks healthy — the domain resolves to Lovable and serves the site.";
    let fix = "";
    let drifted = false;

    if (aRecords.length === 0) {
      drifted = true;
      cause = "No A record found for the domain — DNS is not resolving at all.";
      fix = `Add an A record: @ → ${LOVABLE_IP}`;
    } else if (!pointsToLovable) {
      drifted = true;
      cause = `DNS points to ${aRecords.join(", ")} instead of Lovable (${LOVABLE_IP}). Another host is answering requests${http.status ? `, currently returning ${http.status}` : ""}.`;
      fix = `Change the A record for @ (and www) to ${LOVABLE_IP}, or finish deploying on the host it currently points at.`;
    } else if (!hasVerify) {
      drifted = true;
      cause = "DNS points to Lovable but the _lovable verification TXT record is missing, so the connection stays unverified.";
      fix = "Re-add the TXT record shown in Project Settings → Domains (_lovable = lovable_verify=…).";
    } else if (!serving) {
      drifted = true;
      cause = `The domain resolves to Lovable but returns HTTP ${http.status || "no response"}${http.server ? ` from ${http.server}` : ""}.`;
      fix = "Republish the project, then retry the domain in Project Settings → Domains.";
    }

    return {
      domain: DOMAIN,
      checkedAt: new Date().toISOString(),
      drifted,
      aRecords,
      txtVerify,
      httpStatus: http.status,
      server: http.server,
      cause,
      fix,
    };
  },
);
