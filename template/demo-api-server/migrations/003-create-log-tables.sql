-- Up

create table if not exists create_user (
    log_id integer unique references log(id),
    username text not null,
    email text null null
);

create table change_username (
    log_id integer unique references log(id),
    from_username text not null,
    to_username text not null
);

create table check_username_exist (
    log_id integer unique references log(id),
    username text not null
);

create table console_error (
    log_id integer unique references log(id),
    user_agent integer references str(id)
);

-- Down
drop table if exists console_error;
drop table if exists check_username_exists;
drop table if exists change_username;
drop table if exists create_user;
