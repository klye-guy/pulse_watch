-- Hourly uptime rollups (Kuma 2.0-style aggregates) plus resend-while-down.

create table if not exists monitor_hour_stats (
  monitor_id    text not null references monitors(id) on delete cascade,
  hour_ts       timestamptz not null,
  up_count      integer not null default 0,
  down_count    integer not null default 0,
  pending_count integer not null default 0,
  ping_sum      bigint not null default 0,
  ping_n        integer not null default 0,
  primary key (monitor_id, hour_ts)
);
create index if not exists monitor_hour_stats_hour_idx on monitor_hour_stats (hour_ts);

alter table monitors add column if not exists resend_interval_sec integer not null default 0;
alter table monitors add column if not exists last_notified_at timestamptz;
