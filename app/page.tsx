'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Film, Grid2X2, List, Plus, Search, X, Download } from 'lucide-react';
import { isSeenMovie, type Movie, type SeenMovie } from '@/lib/movies';
const KEY = 'oscar.seen.v1';
export default function Home() {
 const [seen, setSeen] = useState<SeenMovie[]>([]);
 const [ready, setReady] = useState(false);
 const [tab, setTab] = useState<'discover' | 'seen'>('discover');
 const [query, setQuery] = useState('');
 const [movies, setMovies] = useState<Movie[]>([]);
 const [mode, setMode] = useState('');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [storageError, setStorageError] = useState('');
 const [toast, setToast] = useState('');
 const [sort, setSort] = useState('recent');
 const [view, setView] = useState('grid');
 const [page, setPage] = useState(1);
 const [pages, setPages] = useState(1);
 const [retry, setRetry] = useState(0);
 const [about, setAbout] = useState(false);
 const [selected, setSelected] = useState<Movie | null>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const search = useRef<HTMLInputElement>(null);
 useEffect(() => {
  try { const stored = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(stored) || !stored.every(isSeenMovie)) throw new Error(); setSeen(stored); }
  catch { setStorageError('Your saved collection could not be read. Adding and removing are paused so existing data is not overwritten.'); }
  setReady(true);
 }, []);
 useEffect(() => {
  if (tab !== 'discover') return;
  const controller = new AbortController();
  setLoading(true); setError('');
  const timeout = setTimeout(async () => {
   try {
    const res = await fetch(`/api/movies?q=${encodeURIComponent(query)}&page=${page}`, { signal: controller.signal });
    const data = await res.json() as { error?: string; results: Movie[]; mode: string; total_pages: number };
    if (!res.ok) throw new Error(data.error || 'Unable to load movies.');
    setMovies(data.results); setMode(data.mode); setPages(data.total_pages);
   } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load movies.'); }
   finally { if (!controller.signal.aborted) setLoading(false); }
  }, 250);
  return () => { clearTimeout(timeout); controller.abort(); };
 }, [query, tab, page, retry]);
 useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
 useEffect(() => { if (about || selected) dialog.current?.showModal(); else dialog.current?.close(); }, [about, selected]);
 function toggle(movie: Movie) {
  if (!ready || storageError) return;
  const exists = seen.some(m => m.id === movie.id);
  const next = exists ? seen.filter(m => m.id !== movie.id) : [{ ...movie, addedAt: Date.now() }, ...seen];
  try { localStorage.setItem(KEY, JSON.stringify(next)); setSeen(next); setToast(exists ? `${movie.title} removed` : `${movie.title} added to your films`); }
  catch { setToast('Could not save. Your browser storage may be full or unavailable.'); }
 }
 function changeTab(next: 'discover' | 'seen') { setTab(next); setQuery(''); setPage(1); }
 function exportCollection() {
  const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(seen, null, 2)], { type: 'application/json' })); link.href = url; link.download = 'oscar-my-films.json'; link.click(); URL.revokeObjectURL(url);
 }
 const filtered = [...seen].filter(m => m.title.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'year' ? b.release_date.localeCompare(a.release_date) : b.addedAt - a.addedAt);
 const displayed = tab === 'seen' ? filtered : movies;
 return <div className="app-shell">
  <header className="topbar"><button className="brand" onClick={() => changeTab('discover')} aria-label="Oscar home"><span className="brand-icon"><Film size={21}/></span>oscar<span className="brand-dot">.</span></button><nav aria-label="Main navigation"><button className={tab === 'discover' ? 'active' : ''} onClick={() => changeTab('discover')}>Discover</button><button className={tab === 'seen' ? 'active' : ''} onClick={() => changeTab('seen')}>My films <span>{seen.length}</span></button></nav><button className="about-button" onClick={() => setAbout(true)}>A little about Oscar <ArrowUpRight size={14}/></button></header>
  <main>
   <section className="hero"><div className="hero-copy"><p className="eyebrow"><span/> YOUR PERSONAL PICTURE HOUSE</p><h1>Your life,<br/>one <em>film</em> at a time.</h1><p className="intro">The ones you loved. The ones you’re still thinking about.<br className="desktop"/> A little home for every film you’ve seen.</p><button className="primary" onClick={() => {changeTab('discover'); search.current?.focus(); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}><Plus size={18}/> Find a film to add</button></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="film-ticket"><div className="ticket-top">OSCAR PICTURE HOUSE <span>★</span></div><div className="ticket-main"><span>ADMIT ONE</span><strong>A lifetime<br/>of good films.</strong><div className="ticket-seats"><span>ROW<br/><b>YOU</b></span><span>SEAT<br/><b>01</b></span><Film size={40}/></div></div><div className="ticket-bottom">KEEP THE MEMORIES. <span>|||| ||| || |||||</span></div></div><span className="art-caption">Every film has a place here.</span><span className="little-star">✳</span></div></section>
   <section className="collection" id="collection"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>{tab === 'discover' ? 'Find your next memory.' : 'The films that stayed with you.'}</h2></div><span className="collection-count"><b>{String(seen.length).padStart(2, '0')}</b> films seen</span></div>
    <div className="toolbar"><div className="segmented"><button className={tab === 'discover' ? 'selected' : ''} onClick={() => changeTab('discover')}>Explore films</button><button className={tab === 'seen' ? 'selected' : ''} onClick={() => changeTab('seen')}>My films <span>{seen.length}</span></button></div><div className="search"><Search size={18}/><input ref={search} aria-label={tab === 'seen' ? 'Search your films' : 'Search movies'} placeholder={tab === 'seen' ? 'Search your films…' : 'Search for a film…'} value={query} onChange={e => {setQuery(e.target.value); setPage(1);}}/>{query && <button aria-label="Clear search" onClick={() => {setQuery(''); setPage(1);}}><X size={15}/></button>}</div></div>
    <div className="results-heading"><p>{tab === 'discover' ? query ? `Results for “${query}”` : mode === 'live' ? 'Popular right now' : 'A few familiar favorites' : `${filtered.length} ${filtered.length === 1 ? 'film' : 'films'} in your collection`} {tab === 'discover' && mode === 'demo' && <span className="demo-label">DEMO CATALOG · 8 FILMS</span>}</p><div className="view-controls">{tab === 'seen' && <><select aria-label="Sort films" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recently added</option><option value="title">Title A–Z</option><option value="year">Release year</option></select><button title="Export collection" aria-label="Export collection" onClick={exportCollection}><Download size={17}/></button></>}<button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={17}/></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={19}/></button></div></div>
    {storageError && <p role="alert" className="error">{storageError}</p>}
    {tab === 'discover' && loading ? <div className="movie-grid" aria-label="Loading movies" aria-busy="true">{Array.from({length: 8}, (_, i) => <div className="skeleton" key={i}/>)}</div> : tab === 'discover' && error ? <div role="alert" className="empty"><Film/><h3>Intermission, just for a moment.</h3><p>{error}</p><button className="primary" onClick={() => setRetry(retry + 1)}>Try again</button></div> : displayed.length === 0 ? <div className="empty"><Film size={34}/><h3>{query ? 'No films found.' : 'Your opening credits start here.'}</h3><p>{query ? mode === 'demo' && tab === 'discover' ? 'This demo searches eight films. Connect TMDB to search the full catalog.' : 'Try a different title.' : 'Find a film you’ve seen and give it a home in your collection.'}</p>{!query && <button className="primary" onClick={() => changeTab('discover')}><Plus size={17}/> Explore films</button>}</div> : <div className={view === 'grid' ? 'movie-grid' : 'movie-list'}>{displayed.map(movie => {const added = seen.some(m => m.id === movie.id); return <article className="movie" key={movie.id}><button className="poster" onClick={() => setSelected(movie)} aria-label={`Details for ${movie.title}`}><span className="poster-fallback"><Film size={30}/><span>{movie.title}</span></span>{movie.poster_path && <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt="" loading="lazy" onError={e => {e.currentTarget.style.display = 'none';}}/>}{added && <span className="seen-badge"><Check size={13}/> SEEN</span>}</button><div className="movie-info"><button className="movie-title" onClick={() => setSelected(movie)}>{movie.title}</button><span className="year">{movie.release_date.slice(0,4) || 'Year unknown'}</span><p className="movie-overview">{movie.overview}</p></div><button disabled={!ready || !!storageError} className={`seen-button ${added ? 'is-seen' : ''}`} aria-label={`${added ? 'Remove' : 'Add'} ${movie.title} ${added ? 'from' : 'to'} seen films`} aria-pressed={added} onClick={() => toggle(movie)}>{added ? <Check size={16}/> : <Plus size={16}/>}<span>{added ? 'Seen' : 'Mark as seen'}</span></button></article>;})}</div>}
    {tab === 'discover' && !loading && !error && pages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.min(pages,500)}</span><button disabled={page >= Math.min(pages,500)} onClick={() => setPage(page + 1)}>Next</button></div>}
    <div className="collection-note"><span><Check size={14}/> Your collection saves automatically in this browser.</span><span>A small start. A great double feature.</span></div>
   </section>
  </main>
  <footer><span className="footer-brand">oscar.</span><span>For the love of the films.</span><button onClick={() => setAbout(true)}>About & credits <ArrowUpRight size={13}/></button></footer>
  {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
  <dialog ref={dialog} onCancel={() => {setAbout(false); setSelected(null);}} onClick={e => {if(e.target === dialog.current) {setAbout(false);setSelected(null);}}}><button className="close-dialog" aria-label="Close dialog" onClick={() => {setAbout(false);setSelected(null);}}><X/></button>{selected ? <div className="dialog-content"><p className="eyebrow">{selected.release_date.slice(0,4) || 'FILM'}</p><h2>{selected.title}</h2><p>{selected.overview || 'No synopsis available.'}</p><button disabled={!ready || !!storageError} className="primary" onClick={() => toggle(selected)}>{seen.some(m => m.id === selected.id) ? <><Check size={18}/> Seen — remove from collection</> : <><Plus size={18}/> Mark as seen</>}</button></div> : <div className="dialog-content"><p className="eyebrow">THE FIRST REEL</p><h2>A home for your films.</h2><p>Oscar is a simple place to remember what you’ve watched. Search for a film, mark it as seen, and make the collection yours.</p><p>Your collection lives in this browser. It won’t sync to other devices yet, and clearing browser data will remove it. You can export it from My films.</p>{mode === 'demo' && <p className="demo-note">You’re trying a demo catalog of eight films. Full movie search will be available when TMDB is connected.</p>}<div className="credits"><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer"><img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" onError={e => {e.currentTarget.style.display = 'none';}}/>The Movie Database</a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p></div></div>}</dialog>
 </div>;
}
