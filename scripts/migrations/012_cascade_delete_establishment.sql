alter table categories drop constraint categories_establishment_id_fkey;
alter table categories add constraint categories_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table suppliers drop constraint suppliers_establishment_id_fkey;
alter table suppliers add constraint suppliers_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table supply_items drop constraint supply_items_establishment_id_fkey;
alter table supply_items add constraint supply_items_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table products drop constraint products_establishment_id_fkey;
alter table products add constraint products_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table operators drop constraint operators_establishment_id_fkey;
alter table operators add constraint operators_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table orders drop constraint orders_establishment_id_fkey;
alter table orders add constraint orders_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;

alter table settings drop constraint settings_establishment_id_fkey;
alter table settings add constraint settings_establishment_id_fkey
  foreign key (establishment_id) references establishments (id) on delete cascade;
