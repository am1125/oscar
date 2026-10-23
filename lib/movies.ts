export type Movie = { id: number; title: string; release_date: string; poster_path: string | null; overview: string };
export type SeenMovie = Movie & { addedAt: number };
export const demoMovies: Movie[] = [
 { id: 120467, title: 'The Grand Budapest Hotel', release_date: '2014-02-26', poster_path: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', overview: 'A legendary concierge and his young protégé become entangled in a stolen painting and a family fortune.' },
 { id: 157336, title: 'Interstellar', release_date: '2014-11-05', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', overview: 'A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.' },
 { id: 129, title: 'Spirited Away', release_date: '2001-07-20', poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', overview: 'A young girl enters a world ruled by spirits and must find the courage to save her parents.' },
 { id: 496243, title: 'Parasite', release_date: '2019-05-30', poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', overview: 'Two families, worlds apart in wealth, become intertwined in unexpected ways.' },
 { id: 313369, title: 'La La Land', release_date: '2016-11-29', poster_path: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', overview: 'An aspiring actress and a jazz musician fall in love while pursuing their dreams in Los Angeles.' },
 { id: 27205, title: 'Inception', release_date: '2010-07-15', poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', overview: 'A skilled thief who enters dreams is offered a chance to regain his old life.' },
 { id: 545611, title: 'Everything Everywhere All at Once', release_date: '2022-03-24', poster_path: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', overview: 'An exhausted laundromat owner is swept into an adventure across parallel universes.' },
 { id: 155, title: 'The Dark Knight', release_date: '2008-07-16', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', overview: 'Batman faces a criminal mastermind who plunges Gotham into chaos.' }
];
export function isSeenMovie(value: unknown): value is SeenMovie {
 if (!value || typeof value !== 'object') return false;
 const m = value as SeenMovie;
 return Number.isInteger(m.id) && typeof m.title === 'string' && typeof m.release_date === 'string' && typeof m.overview === 'string' && (m.poster_path === null || typeof m.poster_path === 'string') && Number.isFinite(m.addedAt);
}
