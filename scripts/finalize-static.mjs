// Post-build step for Apache / Hostinger shared hosting.
// - Copies the SPA shell to index.html at the root of the build output
// - Copies public/.htaccess into the output (Vite already does, but be safe)
// - Prints a short summary
import { cp, readFile, writeFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";

const OUT = "dist/client";

const shell = await readFile(join(OUT, "_shell.html"), "utf8").catch(() => null);
if (!shell) {
  console.error("[static] _shell.html missing — did the SPA build run?");
  process.exit(1);
}
await writeFile(join(OUT, "index.html"), shell);

try {
  await access(join(OUT, ".htaccess"));
} catch {
  await cp("public/.htaccess", join(OUT, ".htaccess"));
}

const entries = await readdir(OUT);
console.log(`[static] Output ready in ${OUT} (${entries.length} top-level entries), index.html written.`);
