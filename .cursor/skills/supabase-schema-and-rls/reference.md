# Supabase Schema And RLS Reference

## Migration Checklist

When adding a tenant-owned table:

1. Add the table in a new migration.
2. Include `org_id uuid not null references public.orgs(id) on delete cascade` unless the table is global.
3. Add `created_at` and `updated_at` where the record mutates over time.
4. Enable row level security.
5. Add explicit `select`, `insert`, and `update` policies as needed.
6. Add `set_updated_at()` trigger for mutable records.
7. Add `audit_trigger()` for records where history matters.

## Policy Patterns

Typical org-scoped patterns:

```sql
create policy "table_select" on public.example_table
  for select using (org_id = public.current_org_id());

create policy "table_insert" on public.example_table
  for insert with check (org_id = public.current_org_id() and public.is_org_admin());

create policy "table_update" on public.example_table
  for update using (org_id = public.current_org_id() and public.is_org_admin());
```

## Common SaintClaw Rules

- Admin-only writes are common for billing, policies, and governance tables.
- Read access often applies to all org members for org-scoped records.
- Foundation rows such as wallets or policies may need a migration backfill or app-side upsert path.
- Billing and audit tables should preserve append-only history wherever possible.

## Review Questions

- Does the app use the same org boundary as the policy?
- Is there a path for org foundation rows to exist for old tenants?
- Does this table need audit history?
- Is `jsonb` really needed, or would typed columns be safer?
