-- Switches SumUp integration from OAuth (client_credentials) to a static API Key,
-- since Tably always controls a single merchant account directly per establishment
-- (the multi-merchant OAuth flow required manual SumUp scope approval to work at all).
-- Existing rows only ever held OAuth credentials that never worked, so they're dropped
-- rather than migrated; establishments will re-enter their API Key through Settings.
delete from sumup_credentials;
alter table sumup_credentials drop column if exists client_id;
alter table sumup_credentials drop column if exists client_secret;
alter table sumup_credentials add column if not exists api_key text not null;
