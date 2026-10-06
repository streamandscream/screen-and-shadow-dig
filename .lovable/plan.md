# Add “The Shortlist” Top 5 section

## Goal
Create a new editorial section called **The Shortlist** for curated five-title articles such as “What to Watch Once You’ve Finished Emily in Paris” and “Top 5 Christmas Movies.”

## Reader experience
- Add **The Shortlist** to the site menu and footer.
- Create a `/shortlist/` page showing all published lists in the existing one-story-per-row editorial style.
- Create a dedicated `/shortlist/<slug>/` article page with:
  - one clear headline and introduction;
  - an optional featured/starting show;
  - exactly five numbered recommendations, each linking to its existing review;
  - a short editor-written reason for every pick;
  - the existing bottom social-sharing row.
- Use the chosen **Poster Orbit** cover: the featured show is dominant in the centre, with the five recommendation posters layered around it. Seasonal lists without a starting show use the list title as the centrepiece instead.
- Keep the current newspaper-style typography, paper palette, sharp rules, and mobile layout.

## Editor experience
- Add a **Manage Shortlists** area to the editor dashboard.
- Support creating, editing, drafting, publishing, scheduling, and deleting shortlist articles.
- Let the editor search/select existing reviews for the optional featured show and five ranked picks, reorder them, and write a short reason for each.
- Show a live Poster Orbit preview built from the selected covers, with a manual cover upload fallback when artwork is missing.
- Trigger the existing “Publish live” workflow when a shortlist is published.

## Search visibility
- Give the section and every shortlist unique title, description, canonical URL, social preview metadata, and one H1.
- Add `CollectionPage`, `ItemList`, `Article`, and breadcrumb structured data where appropriate.
- Include published shortlist pages in the sitemap, static build list, deployment checks, and `llms.txt` so current and future published lists ship as real pages.
- Credit the source cover artwork consistently with existing review pages.

## Data and permissions
- Add dedicated shortlist and ranked-item records rather than mixing roundups into ordinary reviews.
- Require exactly five unique recommendations before publication; allow incomplete drafts.
- Keep drafts private to authorised editors and expose only published shortlists publicly.
- Apply explicit database grants and row-level access rules matching the existing author/admin model.

## Technical details
- Add public and editor data helpers for shortlists, with ranked items joined to existing posts.
- Add public list/detail routes plus protected editor list/new/edit screens.
- Add a reusable Poster Orbit component for cards, article headers, and editor preview.
- Extend static prerender discovery and post-build verification to shortlist URLs without weakening existing review checks.
- Add focused tests for five-item validation, ordering, draft visibility, URL generation, and responsive cover layout.

## Initial content
The section framework will be ready for the first article, but no shortlist will be published until its five recommendations and copy are chosen.
