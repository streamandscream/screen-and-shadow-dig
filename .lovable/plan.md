## Goal
Remove the current date display from the left-hand side of the site header.

## Where it lives
- `src/components/SiteHeader.tsx`
  - Line 34: `const today = new Date().toLocaleDateString(...)`
  - Line 64: `<span>{today}</span>` inside the top header bar

## Change
1. Delete the `today` const (no longer needed).
2. Remove the `<span>{today}</span>` element from the top header bar.
3. Keep the surrounding flex layout and menu button unchanged.

## Impact
- The left-hand side of the header will be empty, maintaining the existing layout structure.
- No other pages or components reference `today`.