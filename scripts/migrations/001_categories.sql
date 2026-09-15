create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null
);
