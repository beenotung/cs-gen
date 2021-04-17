-- Up

create table if not exists log_meta (
    id integer not null unique,
    call_type text not null, -- e.g. command, query, subscribe
    type text not null unique,
    replay integer not null -- bool
);

create table if not exists log (
    id integer primary key,
    timestamp integer not null,
    acc integer not null, -- to distinct the order of same-time logs
    meta_id integer not null references log_meta(id)
);

-- Down

drop table if exists log;
drop table if exists log_meta;
