create table if not exists settings (
  id integer primary key default 1,
  name text not null default 'Minha Loja',
  cnpj text,
  address text,
  phone text,
  logo_url text,
  receipt_footer_message text,
  pix_qr_code_url text,
  feature_flags jsonb not null default '{"takeout": true, "orderGrouping": true, "splitBill": true}'::jsonb,
  takeout_fee numeric not null default 2,
  constraint settings_singleton check (id = 1)
);

insert into settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists operators (
  id bigint generated always as identity primary key,
  name text not null,
  pin text not null,
  allowed_routes jsonb not null default '[]'::jsonb
);
