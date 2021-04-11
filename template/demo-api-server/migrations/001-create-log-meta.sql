-- Up
create table if not exists log_meta (
    id integer primary key,
    call_type text not null, -- e.g. Command, Query, Subscribe
    type text not null unique,
    replay integer not null -- bool
);

create table if not exists log (
    id integer primary key,
    timestamp integer not null,
    meta_id integer not null references log_meta(id)
);

-- Down
drop table if exists log;
drop table if exists log_meta;
