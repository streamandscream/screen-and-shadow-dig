# Project architecture

- Store curated five-title editorial lists in dedicated `shortlists` and `shortlist_items` tables because their lifecycle and ranked content differ from ordinary reviews.- Review and shows-like pages render a server-prefetched "Featured in The Shortlist" block so every published shortlist gets crawlable links from the pages Google already ranks.
- The site logo is an h1 only on the homepage; every other page owns its single h1 for SEO.
