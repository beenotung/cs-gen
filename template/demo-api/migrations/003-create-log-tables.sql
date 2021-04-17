-- Up

create table if not exists create_user (
    log_id integer unique references log(id),
    username integer not null references str(id),
    email integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (1, 'command', 'create_user', 1);

insert into log_meta (id, call_type, type, replay) values (2, 'query', 'get_all_usernames', 0);

create table if not exists change_username (
    log_id integer unique references log(id),
    from_username integer not null references str(id),
    to_username integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (3, 'command', 'change_username', 1);

create table if not exists check_username_exist (
    log_id integer unique references log(id),
    username integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (4, 'query', 'check_username_exist', 0);

create table if not exists delete_username (
    log_id integer unique references log(id),
    username integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (5, 'command', 'delete_username', 1);

create table if not exists log_browser_stats (
    log_id integer unique references log(id),
    userAgent integer not null references str(id),
    language integer not null references str(id),
    languages integer not null references str(id),
    deviceMemory integer not null,
    hardwareConcurrency integer not null,
    maxTouchPoints integer not null,
    platform integer not null references str(id),
    vendor integer not null references str(id),
    connection integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (6, 'command', 'log_browser_stats', 0);

insert into log_meta (id, call_type, type, replay) values (7, 'subscribe', 'subscribe_username', 0);

create table if not exists cancel_subscribe (
    log_id integer unique references log(id),
    feed_id integer not null references str(id)
);
insert into log_meta (id, call_type, type, replay) values (8, 'command', 'cancel_subscribe', 0);

-- Down

delete from log_meta where id = 8 and type = 'cancel_subscribe';
drop table if exists cancel_subscribe;

delete from log_meta where id = 7 and type = 'subscribe_username';

delete from log_meta where id = 6 and type = 'log_browser_stats';
drop table if exists log_browser_stats;

delete from log_meta where id = 5 and type = 'delete_username';
drop table if exists delete_username;

delete from log_meta where id = 4 and type = 'check_username_exist';
drop table if exists check_username_exist;

delete from log_meta where id = 3 and type = 'change_username';
drop table if exists change_username;

delete from log_meta where id = 2 and type = 'get_all_usernames';

delete from log_meta where id = 1 and type = 'create_user';
drop table if exists create_user;
