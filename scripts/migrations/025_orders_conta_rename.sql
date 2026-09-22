-- Renames the "fiado" (credit sale) concept to "conta" across stored data.

alter table orders rename column fiado_settled_at to conta_settled_at;

update orders
set payments = (
  select coalesce(
    jsonb_agg(
      case
        when payment->>'method' = 'FIADO' then jsonb_set(payment, '{method}', '"CONTA"')
        else payment
      end
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(payments) as payment
)
where payments @> '[{"method": "FIADO"}]';

update operators
set allowed_routes = (
  select coalesce(
    jsonb_agg(case when route = '"/fiado"' then '"/conta"'::jsonb else route end),
    '[]'::jsonb
  )
  from jsonb_array_elements(allowed_routes) as route
)
where allowed_routes @> '["/fiado"]';
