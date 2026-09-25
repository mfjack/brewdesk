update tasks set period = 'opening' where period = 'none';

alter table tasks alter column period set default 'opening';
alter table tasks drop constraint tasks_period_check;
alter table tasks add constraint tasks_period_check check (period in ('opening', 'closing'));
