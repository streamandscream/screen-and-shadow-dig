The user wants the "Next binge" section heading changed to "More like this" everywhere it appears on the site.

## Changes

Update the visible label text in these locations:

1. **Post detail page** (`src/routes/post.$slug.tsx`)
   - Line 111: change heading from `Your next binge if you loved {post.title}` to `More like this`

2. **Admin recommendations bulk editor** (`src/routes/_authenticated/admin.recommendations.tsx`)
   - Line 33: change helper text from `Quickly tweak "Your next binge" for every TV post.` to `Quickly tweak "More like this" for every TV post.`
   - Line 84: change field label from `Your next binge (2–3 titles, comma separated)` to `More like this (2–3 titles, comma separated)`

3. **Admin post edit form** (`src/routes/_authenticated/admin.$id.edit.tsx`)
   - Line 162: change field label from `Your next binge (2–3 titles, comma separated)` to `More like this (2–3 titles, comma separated)`

Internal variable names (e.g., `next_binge`, `bingeLinksQuery`) remain unchanged — only user-facing copy is updated.