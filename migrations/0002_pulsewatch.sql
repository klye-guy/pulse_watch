-- Pulsewatch monitoring schema. Team-shared monitors; access is gated by members.

create table if not exists members (
  user_id    text primary key,
  role       text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists members_role_idx on members (role);

create table if not exists monitors (
  id               text primary key,
  name             text not null,
  type             text not null check (type in ('http', 'keyword', 'tcp', 'ping', 'dns')),
  url              text,
  method           text not null default 'GET',
  keyword          text,
  keyword_invert   boolean not null default false,
  hostname         text,
  port             integer,
  dns_record_type  text not null default 'A',
  interval_sec     integer not null default 60,
  timeout_sec      integer not null default 16,
  accepted_status  text not null default '200-299',
  headers_json     text not null default '{}',
  body             text,
  tags             text not null default '',
  active           boolean not null default true,
  created_by       text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists monitors_active_idx on monitors (active);

create table if not exists heartbeats (
  id          bigserial primary key,
  monitor_id  text not null references monitors(id) on delete cascade,
  status      text not null check (status in ('up', 'down', 'pending')),
  ping        integer,
  msg         text,
  checked_at  timestamptz not null default now()
);
create index if not exists heartbeats_monitor_time_idx on heartbeats (monitor_id, checked_at desc);

create table if not exists notification_channels (
  id         text primary key,
  name       text not null,
  type       text not null check (type in ('webhook', 'discord', 'slack', 'telegram')),
  config     text not null default '{}',
  active     boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists monitor_channels (
  monitor_id text not null references monitors(id) on delete cascade,
  channel_id text not null references notification_channels(id) on delete cascade,
  primary key (monitor_id, channel_id)
);

create table if not exists status_pages (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  description text not null default '',
  published   boolean not null default true,
  created_by  text not null,
  created_at  timestamptz not null default now()
);

create table if not exists status_page_monitors (
  page_id    text not null references status_pages(id) on delete cascade,
  monitor_id text not null references monitors(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (page_id, monitor_id)
);

create table if not exists site_settings (
  key   text primary key,
  value text not null
);

create table if not exists notification_log (
  id         bigserial primary key,
  channel_id text,
  monitor_id text,
  event      text not null,
  detail     text,
  ok         boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists notification_log_time_idx on notification_log (created_at desc);

insert into site_settings (key, value) values
  ('site_name', 'Pulsewatch'),
  ('check_enabled', 'true')
on conflict (key) do nothing;
