import { env } from 'cloudflare:workers';

// Only the public URL and publishable key belong in browser code. Never expose
// a service-role key or Google client secret through this endpoint.
export async function GET() {
 const config = env as { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
 const url = config.SUPABASE_URL;
 const key = config.SUPABASE_PUBLISHABLE_KEY;
 if (!url || !key || !key.startsWith('sb_publishable_')) {
  return Response.json({ configured: false }, { headers: { 'Cache-Control': 'no-store' } });
 }
 try { if (new URL(url).protocol !== 'https:') throw new Error(); }
 catch { return Response.json({ configured: false }, { headers: { 'Cache-Control': 'no-store' } }); }
 return Response.json({ configured: true, url, key }, { headers: { 'Cache-Control': 'no-store' } });
}
