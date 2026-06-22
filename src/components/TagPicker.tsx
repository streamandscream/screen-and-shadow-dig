import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTags, createTag } from "@/lib/tags.functions";

export function TagPicker({
  value,
  onChange,
  max = 10,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const listFn = useServerFn(listTags);
  const createFn = useServerFn(createTag);
  const { data: catalog, refetch } = useQuery({
    queryKey: ["tag-catalog"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = text.trim().toLowerCase();
  const selected = new Set(value.map((v) => v.toLowerCase()));

  const suggestions = useMemo(() => {
    const all = (catalog ?? []).map((t) => t.name);
    return all
      .filter((n) => !selected.has(n.toLowerCase()))
      .filter((n) => (normalized ? n.toLowerCase().includes(normalized) : true))
      .slice(0, 8);
  }, [catalog, normalized, value]);

  const exactExists =
    !!normalized &&
    ((catalog ?? []).some((t) => t.name.toLowerCase() === normalized) ||
      selected.has(normalized));

  const showCreate = !!normalized && !exactExists && value.length < max;

  useEffect(() => {
    setHighlight(0);
  }, [text, open]);

  function add(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (selected.has(clean.toLowerCase())) return;
    if (value.length >= max) return;
    onChange([...value, clean]);
    setText("");
  }

  async function addNew(name: string) {
    const clean = name.trim();
    if (!clean) return;
    add(clean);
    try {
      await createFn({ data: { name: clean } });
      refetch();
    } catch {
      /* ignore — tag still added to post */
    }
  }

  function remove(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const total = suggestions.length + (showCreate ? 1 : 0);
    if (e.key === "Enter") {
      e.preventDefault();
      if (total === 0) {
        if (normalized) addNew(text);
        return;
      }
      if (showCreate && highlight === suggestions.length) {
        addNew(text);
      } else {
        add(suggestions[highlight]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, total - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === "," || e.key === "Tab") {
      if (normalized) {
        e.preventDefault();
        if (exactExists) {
          const match = (catalog ?? []).find(
            (t) => t.name.toLowerCase() === normalized,
          );
          if (match) add(match.name);
        } else {
          addNew(text);
        }
      }
    }
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-2 border border-foreground bg-background p-2 min-h-[3rem]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 border border-foreground px-2 py-1 text-xs font-display uppercase tracking-widest"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(tag);
              }}
              className="ml-1 leading-none text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? "Type to search or create tags…" : ""}
          maxLength={50}
          className="flex-1 min-w-[10rem] bg-transparent outline-none p-1 text-sm"
        />
      </div>

      {open && (suggestions.length > 0 || showCreate) && (
        <div className="absolute z-10 left-0 right-0 mt-1 border border-foreground bg-background max-h-64 overflow-auto">
          {suggestions.map((name, i) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(name);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`block w-full text-left px-3 py-2 text-sm ${
                highlight === i ? "bg-foreground text-background" : ""
              }`}
            >
              #{name}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addNew(text);
              }}
              onMouseEnter={() => setHighlight(suggestions.length)}
              className={`block w-full text-left px-3 py-2 text-sm border-t border-foreground/30 ${
                highlight === suggestions.length ? "bg-foreground text-background" : ""
              }`}
            >
              + Create "{text.trim()}"
            </button>
          )}
        </div>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {value.length}/{max} tags · Enter or comma to add · Backspace to remove last
      </p>
    </div>
  );
}
