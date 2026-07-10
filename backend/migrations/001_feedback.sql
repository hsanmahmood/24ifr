create table if not exists feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references discord_users(id) on delete set null,
    discord_username text,
    message text not null,
    rating smallint check (rating between 1 and 5),
    created_at timestamptz default now()
);