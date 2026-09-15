create table if not exists supply_items (
  id bigint generated always as identity primary key,
  name text not null,
  brand text,
  quantity numeric not null default 0,
  initial_quantity numeric not null default 0,
  unit text not null,
  min_quantity numeric not null default 0,
  cost_price numeric not null default 0,
  supplier_id bigint references suppliers (id) on delete set null,
  expires_at date
);
