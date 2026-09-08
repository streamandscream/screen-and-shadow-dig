import { useEffect, useRef, useState } from "react";

type ShareButtonProps = {
  title: string;
  description?: string | null;
  /** Absolute URL of the post, e.g. https://streamandscream.com/post/slug/ */
  url: string;
  image?: string | null;
  className?: string;
};

export function ShareButton({ title, description, url, image, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const text = description?.trim() || title;

  const canNativeShare = () =>
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare({ title, text, url }));

  const handleClick = async () => {
    if (canNativeShare()) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the sheet or it failed — fall through to menu only on real failure
        return;
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
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
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  const enc = encodeURIComponent;
  const links: { label: string; href: string }[] = [
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${enc(url)}${image ? `&media=${enc(image)}` : ""}&description=${enc(`${title} — ${text}`)}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
    },
  ];

  return (
    <div ref={wrapRef} className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border border-foreground px-5 py-3 font-display uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-colors"
      >
        Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-2 w-48 border border-foreground bg-background shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="block w-full px-4 py-2.5 text-left font-display uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors"
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
          {links.map((l) => (
            <a
              key={l.label}
              role="menuitem"
              href={l.href}
              target={l.label === "Email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 font-display uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
