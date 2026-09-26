-- Decouples "sent to the kitchen together" (informational, no shared payment) from
-- group_id, which is "Juntar comanda" — combined payment, split bill across orders.
alter table orders add column if not exists kitchen_group_id bigint;
