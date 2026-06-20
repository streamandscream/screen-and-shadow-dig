Root cause: `src/routes/_authenticated/admin.tsx` is both a leaf and a parent (it has child routes like `admin.new.tsx`, `admin.$id.edit.tsx`). Because its component doesn't render `<Outlet />`, child routes match the URL but never display — clicking Edit changes the URL but keeps showing the dashboard. Delete looks broken for the same reason on the edit screen, and New Post / Manage Stream / Recommendations / Settings have the same issue.

Fix:
1. Rename `src/routes/_authenticated/admin.tsx` → `src/routes/_authenticated/admin.index.tsx` and update its `createFileRoute` path to `/_authenticated/admin/`.
2. Create a new `src/routes/_authenticated/admin.tsx` layout that simply renders `<Outlet />`.

This lets `/admin` keep showing the dashboard while child routes (`/admin/new`, `/admin/$id/edit`, etc.) render properly.