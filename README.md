# Oscar

A mobile-friendly movie journal. Search, mark films as seen, browse or sort your collection, remove films, and export the collection as JSON.

## Run

Requires Node 22.13+ and npm. Run `npm run install:ci`, then `npm run dev`. Build with `npm run build`.

## Connect TMDB

Obtain an API Read Access Token from https://www.themoviedb.org/settings/api. Set the server-only secret `TMDB_READ_ACCESS_TOKEN` through Sites environment variables before redeploying. For local development, put it in an ignored `.dev.vars` file. Never use a public-prefixed environment variable or commit the token.

With no credential, `/api/movies` explicitly reports demo mode and searches eight sample films. With a credential, it proxies TMDB's popular movies and paginated movie search. Errors are displayed instead of silently replacing live results with demo data.

## Storage and scope

Collections use localStorage under `oscar.seen.v1`, keyed by TMDB movie IDs. They persist across reloads in the same browser and origin. No device sync, accounts, ratings, or ranking yet. Export is available in My films. Clearing browser data removes the collection. An unreadable collection is not overwritten.

Next: account-backed storage shared across web and iOS, then pairwise ranking (choose which of two seen films you prefer). Retain TMDB IDs when migrating.
