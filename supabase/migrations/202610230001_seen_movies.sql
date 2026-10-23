-- Apply once in the Supabase SQL Editor for the Oscar project.
create table public.seen_movies (
 user_id uuid not null references auth.users(id) on delete cascade,
 id bigint not null check (id > 0),
 title text not null check (char_length(title) between 1 and 500),
 release_date text not null default '' check (char_length(release_date) <= 10),
 poster_path text check (poster_path is null or char_length(poster_path) <= 300),
 overview text not null default '' check (char_length(overview) <= 10000),
 added_at bigint not null check (added_at > 0),
 primary key (user_id, id)
);

alter table public.seen_movies enable row level security;
revoke all on public.seen_movies from anon, authenticated;
grant select, insert, delete on public.seen_movies to authenticated;

create policy "Read own movies" on public.seen_movies for select to authenticated
 using ((select auth.uid()) = user_id);
create policy "Add own movies" on public.seen_movies for insert to authenticated
 with check ((select auth.uid()) = user_id);
create policy "Remove own movies" on public.seen_movies for delete to authenticated
 using ((select auth.uid()) = user_id);

create index seen_movies_user_added on public.seen_movies (user_id, added_at desc);
