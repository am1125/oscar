import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Execute the real migration against PostgreSQL, with Supabase's auth.uid()
// contract emulated by the request claim. No external project is needed.
test('movie policies isolate accounts, deny guests, and preserve imports', async () => {
 const db = new PGlite();
 const alice = '11111111-1111-4111-8111-111111111111';
 const bob = '22222222-2222-4222-8222-222222222222';
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as
   $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
   grant usage on schema auth, public to anon, authenticated;
   grant execute on function auth.uid() to anon, authenticated;
   insert into auth.users values ('${alice}'), ('${bob}');`);
  await db.exec(await readFile(new URL('../supabase/migrations/202610230001_seen_movies.sql', import.meta.url), 'utf8'));
  async function asUser(id) {
   await db.exec('reset role; set role authenticated;');
   await db.query("select set_config('request.jwt.claim.sub', $1, false)",[id]);
  }
  await asUser(alice);
  await db.query('insert into public.seen_movies(user_id,id,title,added_at) values ($1,157336,$2,1234)',[alice,'Interstellar']);
  await assert.rejects(db.query('insert into public.seen_movies(user_id,id,title,added_at) values ($1,129,$2,1234)',[bob,'Spirited Away']), /row-level security/);
  await asUser(bob);
  assert.equal((await db.query('select * from public.seen_movies')).rows.length,0);
  assert.equal((await db.query('delete from public.seen_movies where user_id=$1 returning id',[alice])).rows.length,0);
  await db.query('insert into public.seen_movies(user_id,id,title,added_at) values ($1,157336,$2,2222)',[bob,'Interstellar']);
  await asUser(alice);
  await db.query('insert into public.seen_movies(user_id,id,title,added_at) values ($1,157336,$2,9999) on conflict(user_id,id) do nothing',[alice,'Duplicate import']);
  const rows=(await db.query('select * from public.seen_movies')).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].title,'Interstellar');assert.equal(Number(rows[0].added_at),1234);
  await assert.rejects(db.exec("update public.seen_movies set title='tampered'"), /permission denied/);
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.exec('select * from public.seen_movies'), /permission denied/);
  await assert.rejects(db.query('insert into public.seen_movies(user_id,id,title,added_at) values ($1,1,$2,1234)',[alice,'Guest']), /permission denied/);
  await asUser(alice);
  assert.equal((await db.query('delete from public.seen_movies where id=157336 returning id')).rows.length,1);
  await asUser(bob);
  assert.equal((await db.query('select * from public.seen_movies')).rows.length,1);
 } finally {await db.close();}
});
