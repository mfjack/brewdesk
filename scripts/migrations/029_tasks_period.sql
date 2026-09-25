alter table tasks add column if not exists period text not null default 'none' check (period in ('opening', 'closing', 'none'));
