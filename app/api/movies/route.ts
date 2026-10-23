import { env } from 'cloudflare:workers';
import { demoMovies } from '@/lib/movies';
export async function GET(request: Request) {
 const url = new URL(request.url);
 const query = (url.searchParams.get('q') || '').trim().slice(0, 200);
 const page = Math.max(1, Math.min(500, Number(url.searchParams.get('page')) || 1));
 const token = (env as { TMDB_READ_ACCESS_TOKEN?: string }).TMDB_READ_ACCESS_TOKEN;
 if (!token) return Response.json({ mode: 'demo', results: demoMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase())), page: 1, total_pages: 1 });
 const endpoint = new URL(query ? 'https://api.themoviedb.org/3/search/movie' : 'https://api.themoviedb.org/3/movie/popular');
 endpoint.searchParams.set('language', 'en-US');
 endpoint.searchParams.set('page', String(page));
 endpoint.searchParams.set('include_adult', 'false');
 if (query) endpoint.searchParams.set('query', query);
 try {
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) return Response.json({ error: response.status === 401 ? 'Movie search is not connected correctly. Please check the TMDB credential.' : 'Movie search is temporarily unavailable. Please try again.' }, { status: 502 });
  const data = await response.json() as { results: Record<string, unknown>[]; page: number; total_pages: number };
  return Response.json({ mode: 'live', results: data.results.filter(m => !m.adult).map(({id,title,release_date,poster_path,overview}) => ({id,title,release_date:release_date || '',poster_path:poster_path || null,overview:overview || ''})), page: data.page, total_pages: data.total_pages });
 } catch { return Response.json({ error: 'Could not reach movie search. Please try again.' }, { status: 502 }); }
}
