# Make tagging easier in the post editor

Right now tags are a single text box where you type a comma-separated list (`mystery, hulu, true crime`). That's error-prone: easy to misspell, duplicate, or forget what already exists in the catalog.

## What I'll build

A proper **TagPicker** component that replaces the current CSV input on both the New Post and Edit Post screens.

**Features**
- **Chips for selected tags** — each tag shows as a pill with an × to remove.
- **Autocomplete dropdown** — as you type, it filters the existing tag catalog (and tags already used on other posts) and shows matches you can click or arrow-key + Enter to add.
- **Create-new inline** — if what you typed doesn't exist, the dropdown shows `+ Create "horror"`; pressing Enter or clicking it adds the new tag to the post and saves it to the catalog so the next post can reuse it.
- **No duplicates** — already-selected tags are hidden from the suggestion list.
- **Keyboard friendly** — Enter to add the highlighted suggestion, Backspace on empty input removes the last chip, Esc closes the dropdown.

## Technical sketch

- New component `src/components/TagPicker.tsx` (chip UI + suggestion popover, same border/uppercase styling as the rest of the admin).
- New public server fn `listTagCatalog` in `src/lib/tags.functions.ts` — returns the full tag list to any signed-in author/admin (the existing `listTags` is fine but also returns counts; a lighter `{ name }[]` version keeps the picker fast). Called once on editor mount via `useQuery`.
- When a user adds a brand-new tag, the picker calls the existing `createTag` server fn in the background so the catalog stays in sync — no extra trip to `/admin/tags` required.
- Swap `<CsvInput value={form.tags} … />` in `src/routes/_authenticated/admin.$id.edit.tsx` (line 158) for `<TagPicker value={form.tags} onChange={…} />`. The `next_binge` CsvInput on line 162 stays as-is — it isn't a tag catalog.
- No DB schema changes, no migrations.

## Out of scope (ask if you want these too)
- Bulk re-tagging across multiple posts.
- Color-coded tags or tag descriptions.
- A "suggest tags from the post body" AI helper.
