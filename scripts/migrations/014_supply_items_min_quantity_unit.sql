alter table supply_items add column if not exists min_quantity_unit text;

update supply_items set min_quantity_unit = unit where min_quantity_unit is null;

alter table supply_items alter column min_quantity_unit set not null;
alter table supply_items alter column min_quantity_unit set default 'kg';
