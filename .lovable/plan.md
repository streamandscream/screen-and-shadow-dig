# Simplify the post Quick Answers template

## Goal
Trim the "What to know before you watch" section on post pages and drop the duplicated "More like this" block.

## Changes

1. **Remove two questions** from `buildQuickAnswers()` in `src/lib/posts.public.ts`:
   - "Where can I watch {title} in the UK?" (and its Where-to-watch link rendering)
   - "What kind of show is {title}?"

   Remaining questions: "Is {title} worth watching?", "What is {title} about?", "What should I watch after {title}?".

2. **"What should I watch after {title}?" becomes a bullet list** in `src/routes/post.$slug.tsx`:
   - One recommendation per line (bullet points)
   - Each title links to its post page when a matching published post exists; plain text otherwise
   - Keep the "more shows like this" link after the list

3. **Remove the "More like this" section** at the bottom of the post page (the aside block) since the bullet list now covers it.

4. The FAQPage JSON-LD schema updates automatically since it is built from the same `buildQuickAnswers()` output.

## Technical details
- Files: `src/lib/posts.public.ts`, `src/routes/post.$slug.tsx`
- The now-unused `renderWatchAnswer` helper and `WhereToWatchLink` import in the Quick Answers context get cleaned up (the main "Where to watch" button near the top of the post stays).
- No database changes.
