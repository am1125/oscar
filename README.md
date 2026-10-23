# Oscar

A mobile-friendly movie journal. Search for films, mark them as seen, and browse your collection.

## Run the MVP locally

### 1. Install the prerequisites

You need **Node.js 22.13 or newer**, **npm**, and **Git** installed on your computer. Check them in a terminal:

```sh
node --version
npm --version
git --version
```

### 2. Clone the repository

```sh
git clone https://github.com/am1125/oscar.git
cd oscar
```

The repository root contains `package.json`; run the following commands from that directory.

### 3. Install dependencies

```sh
npm run install:ci
```

This installs the versions recorded in the lockfile. You only need to repeat this when dependencies change or you start from a fresh checkout.

### 4. Start the local server

```sh
npm run dev
```

Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** in your browser. If the terminal prints a different Local URL, use that URL instead.

Keep the terminal running while you use the app. Source changes refresh the preview automatically. Press **Ctrl+C** in the terminal to stop the server. To start it again later, return to the project directory and run `npm run dev`.

No TMDB credential or Supabase account is needed for the browser-only demo. Google sign-in and cloud saving require the optional Supabase setup below. The hosting development identity is separate from your Oscar account.

## Try the demo

Without a TMDB credential, Oscar shows a clearly labeled **eight-film demo catalog**.

1. Search for a demo title, such as **Interstellar**.
2. Click **Mark as seen**.
3. Open **My films** to view the collection.
4. Reload the page to confirm it was saved.
5. Click **Seen** to remove a film, or use the export button in My films to download the collection as JSON.

Your collection is saved in this browser's local storage. It does not sync across devices, and clearing browser data removes it. Use the same address each time: `localhost` and `127.0.0.1` have separate browser storage, as do different ports. The hosted site also has its own collection.

## Optional: connect the full TMDB catalog

Once your TMDB API access is approved:

1. Find your **API Read Access Token** in [TMDB API settings](https://www.themoviedb.org/settings/api).
2. Create a file named `.dev.vars` in the project root, alongside `package.json`.
3. Add this line, replacing the placeholder with your token:

   ```dotenv
   TMDB_READ_ACCESS_TOKEN=your_read_access_token_here
   ```

4. Stop the local server with **Ctrl+C**, then restart it:

   ```sh
   npm run dev
   ```

Oscar will use TMDB's popular movies and full movie search instead of the demo catalog. This needs an internet connection. If the credential is invalid or TMDB is unavailable, the app displays an error instead of silently switching to demo results.

`.dev.vars` is ignored by Git. Keep the token there; do not put it in browser code, the README, or a public-prefixed environment variable. Local credentials do not configure the deployed site; configure its server-side secret separately through Sites environment settings.

## Optional: Google accounts and cloud collections

Follow [the Supabase and Google setup guide](supabase/SETUP.md) to create the database, configure Google OAuth, and connect Oscar. Sign-in is Google-only. Your account collection can be shared by localhost and the deployed app when both point to the same Supabase project. Browser-only collections remain available for guests and can be imported after signing in.

Run `npm test` to check the database access policies locally without a Supabase project.

## Troubleshooting

- **`node` or `npm` is not found:** install Node.js with npm, then reopen your terminal.
- **The page cannot be reached:** check that `npm run dev` is still running and open the Local URL printed in that terminal.
- **Port 5173 is already in use:** stop the other preview server or use the alternate URL printed by the dev server.
- **Search only finds eight movies:** this is demo mode. Add the TMDB token as described above and restart the server.
- **Your collection looks empty:** check that you are using the same browser, address, and port where you saved it.

## Check the production build

```sh
npm run build
```

The local development workflow above is enough to try the MVP; you do not need to deploy it.

## Current scope

Included: search, a seen-films collection, removal, sorting, grid/list views, and JSON export. Google sign-in, per-account cloud storage, and browser collection import are implemented but require Supabase and Google configuration. Ratings and ranking are not implemented yet.
