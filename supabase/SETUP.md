# Connect Oscar to Supabase email accounts

Oscar supports email/password sign-up, sign-in, confirmation-email resend, password reset, and per-user movie collections. Google Cloud setup is not needed.

## 1. Create the database

In your Supabase project's SQL Editor, run `supabase/migrations/202610230001_seen_movies.sql` once. If you already applied it, do not run it again. This creates the movie table and policies restricting each account to its own records.

## 2. Enable email accounts

In Authentication → Sign In / Providers → Email, enable email sign-up and keep **Confirm email** enabled. Set the minimum password length to at least 8 characters. The app also enforces 8 characters for new passwords.

In Authentication → URL Configuration:

- Set Site URL to `https://oscar-movie-journal.grey-sun-7710.chatgpt.site`.
- Add the following exact Redirect URLs:
  - `http://localhost:5173/`
  - `http://127.0.0.1:5173/`
  - `https://oscar-movie-journal.grey-sun-7710.chatgpt.site/`

Confirmation and reset links return to Oscar's home page. The app uses PKCE: open email links in the same browser and on the same device where you requested them. An expired or already-used link needs to be requested again. The password recovery event opens the new-password form automatically.

## 3. Email delivery for testing

Supabase's default email sender is limited to email addresses belonging to members of the project's organization, and currently allows only two emails per hour. Start testing with your own Supabase organization email. You may hit the rate limit when testing confirmation and reset back-to-back.

For other testers or production, configure a custom SMTP sender in Supabase Authentication settings. Do not give testers organization-admin access merely to receive emails. Keep email confirmation enabled. SMTP credentials belong in Supabase, not in Oscar's browser code or Git.

Official instructions:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-smtp

## 4. Connect the local app

Find the project URL and publishable key in the project's Connect dialog or API settings. Add them to `.dev.vars` alongside `package.json`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Keep any existing `TMDB_READ_ACCESS_TOKEN` line. Restart `npm run dev` and open `http://localhost:5173/`.

Use the **publishable** key beginning `sb_publishable_`, never a service-role/secret key or database password. This key is public by design; signed-in user sessions and database policies control access. The `.dev.vars` file is ignored by Git.

## 5. Connect the hosted app

Set the same two variables in the Site's runtime environment settings and redeploy. Localhost and the hosted app can then share the same Supabase account collection. Their unsigned-in browser collections remain separate.

The hosted preview remains owner-private through Sites. Its hosting access gate is separate from the Oscar email account. Adding Supabase accounts does not make the hosted Site public.

## 6. Test the flow

1. Open **Sign in / Create account**, choose **Create an account**, and enter your email and password.
2. Follow the confirmation email in the same browser. If needed, use **Resend confirmation email**.
3. Sign in, add a film, and reload. The film should remain.
4. Sign out and sign in again, or sign in on another device. Your collection should return.
5. Use **Forgot password?**, follow the email link, and set a new password. Verify the new password works.
6. If you have browser films, use **Import browser films** after signing in. Import merges without replacing existing account records and retains the original browser copy.
7. With a second test account, verify its collection is separate.

Run `npm test` for local policy and email-auth request tests. Live email delivery, session callbacks, and cloud persistence also need verification against your configured project. Until configured, the app keeps browser-only demo mode and explains that accounts await setup.
