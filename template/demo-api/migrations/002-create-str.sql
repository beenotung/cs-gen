-- Up

create table if not exists str (
    id integer primary key,
    str text not null unique
);

-- Down

drop table if exists str;
