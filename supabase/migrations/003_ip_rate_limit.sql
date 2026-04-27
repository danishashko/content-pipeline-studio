-- ---------------------------------------------------------------------------
-- IP-based lifetime rate limiting
-- One row per IP, request_count caps requests for life of the deployment.
-- ---------------------------------------------------------------------------
create table if not exists ip_usage (
  ip            text         primary key,
  request_count integer      not null default 0,
  first_seen_at timestamptz  not null default now(),
  last_seen_at  timestamptz  not null default now()
);

-- Atomic check-and-increment.
-- Inserts the row on first sight, increments on every call.
-- Returns the *new* count so the caller can decide allow/deny.
-- This avoids the read-then-write race that would let two concurrent
-- requests both see count=4 and both pass (pushing to 6).
create or replace function increment_ip_usage(p_ip text)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  insert into ip_usage (ip, request_count, last_seen_at)
  values (p_ip, 1, now())
  on conflict (ip) do update
    set request_count = ip_usage.request_count + 1,
        last_seen_at  = now()
  returning request_count into new_count;

  return new_count;
end;
$$;
