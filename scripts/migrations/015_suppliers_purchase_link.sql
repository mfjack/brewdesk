alter table suppliers add column if not exists purchase_link text;

alter table suppliers drop column if exists payment_terms;
