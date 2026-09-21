-- Retries before confirmed down, plus email notification channels.

alter table monitors add column if not exists max_retries integer not null default 2;
alter table monitors add column if not exists retry_interval_sec integer not null default 20;
alter table monitors add column if not exists fail_streak integer not null default 0;
alter table monitors add column if not exists confirmed_status text not null default 'pending';

alter table notification_channels drop constraint if exists notification_channels_type_check;

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'notification_channels'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%webhook%'
    and conname <> 'notification_channels_type_check';
  if cname is not null then
    execute format('alter table notification_channels drop constraint %I', cname);
  end if;
end
$$;

alter table notification_channels
  add constraint notification_channels_type_check
  check (type in ('webhook', 'discord', 'slack', 'telegram', 'email'));
