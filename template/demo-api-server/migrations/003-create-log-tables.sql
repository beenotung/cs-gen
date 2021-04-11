-- Up

create table if not exists create_user (
    log_id integer unique references log(id),
    username text not null,
    email text null null
);

create table change_username (
    log_id integer unique references log(id),
    from text not null,
    to text not null
);

create table check_username_exist (
    log_id integer unique references log(id),
    username text not null,
);

create table console_error (
    log_id integer unique references log(id),
    user_agent integer references str(id)
);
