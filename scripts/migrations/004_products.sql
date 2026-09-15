create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  photo_url text,
  price numeric not null default 0,
  cost_price numeric not null default 0,
  quantity numeric not null default 0,
  track_stock boolean not null default true,
  low_stock_threshold numeric not null default 0,
  category_id bigint not null references categories (id) on delete cascade,
  supplier_id bigint references suppliers (id) on delete set null,
  recipe jsonb not null default '[]'::jsonb
);
