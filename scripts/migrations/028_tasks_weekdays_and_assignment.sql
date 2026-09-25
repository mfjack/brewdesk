alter table tasks drop constraint tasks_recurrence_check;
alter table tasks add constraint tasks_recurrence_check check (recurrence in ('once', 'daily', 'weekly', 'monthly'));

alter table tasks add column if not exists weekdays text[] not null default '{}';
alter table tasks add column if not exists assigned_operator_id bigint references operators (id) on delete set null;
