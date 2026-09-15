create table if not exists orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  total numeric not null default 0,
  order_items jsonb not null default '[]'::jsonb,
  observation text,
  printed_item_quantities jsonb not null default '{}'::jsonb,
  is_takeout boolean not null default false,
  operator_name text,
  payments jsonb not null default '[]'::jsonb,
  group_id bigint
);
