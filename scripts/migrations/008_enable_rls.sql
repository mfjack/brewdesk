alter table categories enable row level security;
alter table suppliers enable row level security;
alter table supply_items enable row level security;
alter table products enable row level security;
alter table settings enable row level security;
alter table operators enable row level security;
alter table orders enable row level security;

create policy "authenticated_full_access" on categories for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on suppliers for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on supply_items for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on products for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on settings for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on operators for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on orders for all to authenticated using (true) with check (true);
