create table if not exists suppliers (
  id bigint generated always as identity primary key,
  company_name text not null,
  whatsapp text,
  supplies_description text,
  payment_terms text,
  delivery_days jsonb not null default '[]'::jsonb,
  delivery_period text
);
