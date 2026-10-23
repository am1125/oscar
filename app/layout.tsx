import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Oscar — Your life in movies', description: 'A little home for every film you have seen.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
