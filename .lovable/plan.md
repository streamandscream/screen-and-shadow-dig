## Fix: Restrict `covers` bucket writes to authors/admins

Replace the three overly-permissive storage policies with role-gated versions using `public.has_role()`.

### Migration

Drop and recreate policies on `storage.objects` for the `covers` bucket:

- `covers_insert_auth` → require `has_role(auth.uid(),'author')` OR `has_role(auth.uid(),'admin')`
- `covers_update_auth` → same role check
- `covers_delete_auth` → same role check

Public SELECT (read) policy stays unchanged so cover images remain viewable.

### After migration

Call `manage_security_finding` to mark `covers_bucket_broad_write_access` as fixed, and update `@security-memory` to note that covers writes are author/admin-only.
