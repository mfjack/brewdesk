create table if not exists establishments (
  id bigint generated always as identity primary key,
  name text not null,
  owner_user_id uuid not null unique references auth.users (id)
);

alter table categories add column if not exists establishment_id bigint references establishments (id);
alter table suppliers add column if not exists establishment_id bigint references establishments (id);
alter table supply_items add column if not exists establishment_id bigint references establishments (id);
alter table products add column if not exists establishment_id bigint references establishments (id);
alter table operators add column if not exists establishment_id bigint references establishments (id);
alter table orders add column if not exists establishment_id bigint references establishments (id);
alter table settings add column if not exists establishment_id bigint references establishments (id);
