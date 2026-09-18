import { useState } from "react";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
  description?: string | null;
  /** Absolute URL of the post, e.g. https://streamandscream.com/post/slug/ */
  url: string;
  image?: string | null;
  className?: string;
};

export function ShareButton({ title, description, url, image, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const text = description?.trim() || title;
  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const enc = encodeURIComponent;
  const links: { label: string; href: string; className: string; icon: string }[] = [
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${enc(url)}${image ? `&media=${enc(image)}` : ""}&description=${enc(`${title} — ${text}`)}`,
      className: "social-share-pinterest",
      icon: "P",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
      className: "social-share-x",
      icon: "𝕏",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      className: "social-share-facebook",
      icon: "f",
    },
  ];

  const shareToInstagram = async () => {
    const instagramWindow = window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    await copyLink();
    if (!instagramWindow) window.location.assign("https://www.instagram.com/");
  };

  return (
    <div className={cn("social-share", className)} aria-label="Share this review">
      <p className="eyebrow text-muted-foreground">Share this review</p>
      <div className="mt-3 flex items-center gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${link.label}`}
            title={`Share on ${link.label}`}
            className={cn("social-share-icon", link.className)}
          >
            <span aria-hidden="true">{link.icon}</span>
          </a>
        ))}
        <Button
          type="button"
          size="icon"
          onClick={shareToInstagram}
          aria-label="Copy link and open Instagram"
          title="Copy link and open Instagram"
          className="social-share-icon social-share-instagram"
        >
          <Instagram aria-hidden="true" />
        </Button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {copied ? "Link copied — paste it into Instagram" : ""}
      </p>
    </div>
  );
}
