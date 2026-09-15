alter table establishments drop constraint establishments_owner_user_id_fkey;
alter table establishments add constraint establishments_owner_user_id_fkey
  foreign key (owner_user_id) references auth.users (id) on delete cascade;
