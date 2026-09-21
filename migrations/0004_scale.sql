-- Denormalize last check onto monitors so 100–150 checks do not scan heartbeats.

alter table monitors add column if not exists last_checked_at timestamptz;
alter table monitors add column if not exists last_status text not null default 'pending';
alter table monitors add column if not exists last_ping integer;
alter table monitors add column if not exists last_msg text;

create index if not exists monitors_due_idx on monitors (active, last_checked_at);

update monitors m
set
  last_checked_at = h.checked_at,
  last_status = h.status,
  last_ping = h.ping,
  last_msg = h.msg
from (
  select distinct on (monitor_id) monitor_id, status, ping, msg, checked_at
  from heartbeats
  order by monitor_id, checked_at desc
) h
where m.id = h.monitor_id
  and m.last_checked_at is null;
