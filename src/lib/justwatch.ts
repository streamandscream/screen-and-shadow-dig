export type JustWatchInfo = {
  justwatch_slug?: string | null;
  justwatch_type?: string | null;
  justwatch_country?: string | null;
};

export function buildJustWatchUrl(
  post: JustWatchInfo,
  affiliateTemplate?: string | null,
): string | null {
  if (!post.justwatch_slug) return null;
  const country = (post.justwatch_country || "us").toLowerCase().trim();
  const rawType = (post.justwatch_type || "tv-show").toLowerCase().trim();
  const type = ["movie", "film"].includes(rawType) ? "movie" : "tv-show";
  const url = `https://www.justwatch.com/${country}/${type}/${post.justwatch_slug}`;
  if (affiliateTemplate && affiliateTemplate.includes("{url}")) {
    return affiliateTemplate.replace("{url}", encodeURIComponent(url));
  }
  return url;
}
