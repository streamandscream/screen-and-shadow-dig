// Post-build step for Apache / Hostinger shared hosting.
// - Keeps the prerendered "/" page as index.html (the real homepage)
// - Writes the SPA shell to spa.html (Apache fallback for non-prerendered routes)
// - Removes the internal /shell route output and private routes from the output/sitemap
import { cp, readFile, writeFile, access, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist/client";

// The SPA shell is prerendered at /shell (see vite.config.ts spa.maskPath).
const shell =
  (await readFile(join(OUT, "shell", "index.html"), "utf8").catch(() => null)) ??
  (await readFile(join(OUT, "_shell.html"), "utf8").catch(() => null));

if (!shell) {
  console.error("[static] SPA shell missing — did the SPA build run?");
  process.exit(1);
}
await writeFile(join(OUT, "spa.html"), shell);
await rm(join(OUT, "shell"), { recursive: true, force: true });
await rm(join(OUT, "_shell.html"), { force: true });

// index.html must exist at the root and must be the real prerendered homepage.
const homePath = join(OUT, "index.html");
const home = await readFile(homePath, "utf8").catch(() => null);
if (!home) {
  console.error("[static] index.html missing — the '/' page was not prerendered.");
  process.exit(1);
}
if (home === shell) {
  console.error(
    "[static] index.html is the SPA shell, not the real homepage. Check spa.maskPath in vite.config.ts.",
  );
  process.exit(1);
}

try {
  await access(join(OUT, ".htaccess"));
} catch {
  await cp("public/.htaccess", join(OUT, ".htaccess"));
}

// Remove private/internal routes from the sitemap
const sitemapPath = join(OUT, "sitemap.xml");
const sitemap = await readFile(sitemapPath, "utf8").catch(() => null);
if (sitemap) {
  let cleaned = sitemap.replace(
    /\s*<url>\s*<loc>[^<]*\/(admin|auth|shell|tag|search)[^<]*<\/loc>[\s\S]*?<\/url>/g,
    "",
  );
  // The TanStack Start sitemap plugin stamps every <url> with a build-time
  // <lastmod> (today's date). That is not a page-specific timestamp, so strip
  // it per the sitemap lastmod policy rather than ship a misleading value.
  cleaned = cleaned.replace(/\s*<lastmod>[^<]*<\/lastmod>/g, "");
  // Apache/Hostinger canonicalizes every page to a trailing-slash URL, so
  // sitemap entries must match or Google reports them all as redirects.
  cleaned = cleaned.replace(/<loc>(https:\/\/[^<]*[^/</])<\/loc>/g, "<loc>$1/</loc>");
  await writeFile(sitemapPath, cleaned);
}

// Don't ship prerendered editor pages
await rm(join(OUT, "admin"), { recursive: true, force: true });
await rm(join(OUT, "auth"), { recursive: true, force: true });

const { size } = await stat(homePath);
console.log(
  `[static] Output ready in ${OUT} — real homepage at index.html (${size} bytes), spa.html fallback, sitemap cleaned.`,
);
