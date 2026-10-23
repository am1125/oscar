# Connect Oscar to Supabase and Google

The code supports Google sign-in and per-user collections. Live sign-in needs the project configuration below. No email/password flow is used.

## 1. Create a free Supabase project

At https://supabase.com/dashboard, create a Free organization/project named Oscar, choose a nearby region, and save its database password privately. Wait for provisioning to finish.

Open the project's SQL Editor and run the contents of `supabase/migrations/202610230001_seen_movies.sql` once. This creates the collection table and policies that restrict reads, inserts, and deletes to the signed-in owner. The app uses the public publishable key with each user's session; it never uses a service-role key.

## 2. Configure Google sign-in

In https://console.cloud.google.com/, create or select a project for Oscar. Open Google Auth Platform:

1. Set up the consent screen/branding (Oscar, your support email, and your developer contact email).
2. Choose the appropriate audience. For a personal Google account, use External. While the app is in Testing, add your own Google email and any testers under Test users.
3. Request only `openid`, email, and basic profile scopes.
4. Create an OAuth client of type **Web application**.
5. Add your web origins: `http://localhost:5173` for local testing and `https://oscar-movie-journal.grey-sun-7710.chatgpt.site` for this hosted preview. Use the same origin consistently when testing.
6. In Supabase, open Authentication → Sign In / Providers → Google. Copy the project's callback URL into Google's **Authorized redirect URIs**. For a hosted Supabase project this is `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`—use the actual value shown by Supabase even when Oscar runs on localhost.
7. Copy Google's client ID and client secret into Supabase's Google provider settings and enable the provider. Store the secret only there, not in Oscar's source or browser configuration.

In Supabase Authentication → URL Configuration:

- Set Site URL to `https://oscar-movie-journal.grey-sun-7710.chatgpt.site`.
- Allow these exact redirect URLs: `http://localhost:5173/`, `http://127.0.0.1:5173/`, and `https://oscar-movie-journal.grey-sun-7710.chatgpt.site/`.
- If you use another local port, add its exact URL too.

Google redirects to Supabase's callback. Supabase then redirects to Oscar. These are two different URL settings. Oscar uses PKCE, so finish the login in the same browser that started it. If Google refuses an embedded browser, open Oscar in your regular Chrome or Safari browser.

Official instructions: https://supabase.com/docs/guides/auth/social-sign-in/auth-google

## 3. Configure Oscar locally

Find your Supabase project URL and **publishable key** in the project's Connect dialog or API settings. The key starts with `sb_publishable_`. Add these to the ignored `.dev.vars` file in the repository root:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Keep any existing `TMDB_READ_ACCESS_TOKEN` line in that file. Do not supply a Supabase secret/service-role key, database password, or Google secret. The public URL and publishable key are deliberately sent to the browser; access is enforced by the database policies and user session.

Restart `npm run dev`, open `http://localhost:5173/`, and click **Continue with Google**. Without configuration, Oscar explicitly shows that cloud accounts await setup and preserves browser-only demo behavior.

## 4. Configure the hosted app

Set the same two variables in the Site's runtime environment settings, then redeploy. This lets localhost and the hosted app use the same Supabase account collection. Their guest collections remain separate.

The hosted preview is still owner-private through Sites. That hosting access gate is separate from Oscar's Google account. Google sign-in does not make the Site publicly accessible. Change hosting access only when you intend to invite other people.

## 5. Verify with your account

- Sign in, mark a film as seen, and reload.
- Sign out: account films should disappear from the current view, but remain saved in Supabase.
- Sign back in: the account collection should return.
- Sign in from a second browser or device: the same films should load.
- If you already have browser films, use **Import browser films** after signing in. Import merges without replacing existing account records and retains the browser copy.
- Test with a second Google account: it should have its own collection.
- Export remains available under My films.

The migration has automated PostgreSQL policy tests (`npm test`). Actual Google login, redirect settings, and cloud persistence must also be verified against the configured project.
