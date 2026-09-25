create table if not exists tasks (
  id bigint generated always as identity primary key,
  establishment_id bigint not null references establishments (id) on delete cascade,
  title text not null,
  recurrence text not null check (recurrence in ('once', 'daily', 'weekly')),
  last_completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "own_establishment_only" on tasks for all to authenticated
  using (establishment_id in (select id from establishments where owner_user_id = auth.uid()))
  with check (establishment_id in (select id from establishments where owner_user_id = auth.uid()));

alter publication supabase_realtime add table tasks;
