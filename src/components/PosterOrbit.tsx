import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type OrbitPoster = {
  slug: string;
  title: string;
  cover_url: string | null;
};

type PosterOrbitProps = {
  title: string;
  anchor?: OrbitPoster | null;
  picks: OrbitPoster[];
  coverUrl?: string | null;
  className?: string;
  linked?: boolean;
};

const positions = [
  "left-[2%] top-[7%] -rotate-6",
  "right-[2%] top-[7%] rotate-6",
  "left-[4%] bottom-[5%] rotate-3",
  "right-[4%] bottom-[5%] -rotate-3",
  "left-1/2 bottom-[2%] -translate-x-1/2 rotate-2",
];

function Poster({ poster, className, linked }: { poster: OrbitPoster; className: string; linked: boolean }) {
  const image = poster.cover_url ? (
    <img src={poster.cover_url} alt={`${poster.title} poster`} className="h-full w-full object-cover object-top" />
  ) : (
    <span className="flex h-full items-center justify-center bg-paper p-2 text-center font-display text-xs">{poster.title}</span>
  );

  return linked ? (
    <Link to="/post/$slug/" params={{ slug: poster.slug }} aria-label={`Read our ${poster.title} review`} className={className}>
      {image}
    </Link>
  ) : <div className={className}>{image}</div>;
}

export function PosterOrbit({ title, anchor, picks, coverUrl, className, linked = true }: PosterOrbitProps) {
  if (coverUrl) {
    return <img src={coverUrl} alt={`${title} cover`} className={cn("aspect-[16/10] w-full object-cover", className)} />;
  }

  return (
    <figure
      className={cn("relative isolate aspect-[16/10] overflow-hidden border-2 border-foreground bg-paper", className)}
      aria-label={`${title} featuring five recommendations`}
    >
      <div className="absolute inset-0 opacity-30 shortlist-grid" aria-hidden="true" />
      {picks.slice(0, 5).map((pick, index) => (
        <Poster
          key={pick.slug}
          poster={pick}
          linked={linked}
          className={cn(
            "shortlist-poster absolute z-10 aspect-[2/3] w-[24%] overflow-hidden border-2 border-background bg-paper shadow-lg transition-transform hover:z-30 hover:scale-105",
            positions[index],
          )}
        />
      ))}
      {anchor ? (
        <Poster
          poster={anchor}
          linked={linked}
          className="shortlist-poster absolute left-1/2 top-1/2 z-20 aspect-[2/3] w-[31%] -translate-x-1/2 -translate-y-1/2 overflow-hidden border-4 border-background bg-paper shadow-xl transition-transform hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute left-1/2 top-1/2 z-20 flex aspect-square w-[36%] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-4 border-background bg-accent-red p-4 text-center shadow-xl">
          <span className="font-display text-base leading-tight text-primary-foreground sm:text-2xl">{title}</span>
        </div>
      )}
      <figcaption className="sr-only">{anchor ? `${anchor.title} surrounded by five recommended titles` : `Five picks for ${title}`}</figcaption>
    </figure>
  );
}