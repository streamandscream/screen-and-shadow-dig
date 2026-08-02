// Post-build step for Apache / Hostinger shared hosting.
// - Keeps the prerendered "/" page as index.html
// - Writes the SPA shell to spa.html (Apache fallback for non-prerendered routes)
// - Strips private routes (/admin, /auth) from the generated sitemap
import { cp, readFile, writeFile, access, rm } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist/client";

const shell = await readFile(join(OUT, "_shell.html"), "utf8").catch(() => null);
if (!shell) {
  console.error("[static] _shell.html missing — did the SPA build run?");
  process.exit(1);
}
await writeFile(join(OUT, "spa.html"), shell);

// index.html must exist at the root: prefer the prerendered home page.
try {
  await access(join(OUT, "index.html"));
} catch {
  await writeFile(join(OUT, "index.html"), shell);
}

try {
  await access(join(OUT, ".htaccess"));
} catch {
  await cp("public/.htaccess", join(OUT, ".htaccess"));
}

// Remove private routes from the sitemap
const sitemapPath = join(OUT, "sitemap.xml");
const sitemap = await readFile(sitemapPath, "utf8").catch(() => null);
if (sitemap) {
  const cleaned = sitemap.replace(
    /\s*<url>\s*<loc>[^<]*\/(admin|auth)[^<]*<\/loc>[\s\S]*?<\/url>/g,
    "",
  );
  await writeFile(sitemapPath, cleaned);
}

// Don't ship prerendered editor pages
await rm(join(OUT, "admin"), { recursive: true, force: true });
await rm(join(OUT, "auth"), { recursive: true, force: true });

console.log("[static] Output ready in dist/client — index.html at root, spa.html fallback, sitemap cleaned.");
