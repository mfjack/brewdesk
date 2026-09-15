create table if not exists sumup_credentials (
  establishment_id bigint primary key references establishments (id) on delete cascade,
  client_id text not null,
  client_secret text not null,
  merchant_code text not null,
  reader_id text,
  reader_name text,
  reader_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sumup_credentials enable row level security;

create table if not exists sumup_charges (
  id bigint generated always as identity primary key,
  establishment_id bigint not null references establishments (id) on delete cascade,
  order_id bigint not null references orders (id) on delete cascade,
  client_transaction_id text not null unique,
  amount numeric not null,
  status text not null default 'pending',
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sumup_charges enable row level security;

create policy "own_establishment_read" on sumup_charges for select to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

alter publication supabase_realtime add table sumup_charges;
