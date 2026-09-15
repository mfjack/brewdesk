alter table categories alter column establishment_id set not null;
alter table suppliers alter column establishment_id set not null;
alter table supply_items alter column establishment_id set not null;
alter table products alter column establishment_id set not null;
alter table operators alter column establishment_id set not null;
alter table orders alter column establishment_id set not null;

alter table settings alter column establishment_id set not null;
alter table settings drop constraint settings_singleton;
alter table settings drop constraint settings_pkey;
alter table settings add primary key (establishment_id);
alter table settings drop column id;

alter table establishments enable row level security;

create policy "owner_full_access" on establishments for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy "authenticated_full_access" on categories;
drop policy "authenticated_full_access" on suppliers;
drop policy "authenticated_full_access" on supply_items;
drop policy "authenticated_full_access" on products;
drop policy "authenticated_full_access" on settings;
drop policy "authenticated_full_access" on operators;
drop policy "authenticated_full_access" on orders;

create policy "own_establishment_only" on categories for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on suppliers for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on supply_items for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on products for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on settings for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on operators for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

create policy "own_establishment_only" on orders for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

alter publication supabase_realtime add table establishments;
