import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PlaylistProvider } from '@/components/playlist/PlaylistProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spotify Clone',
  description: 'A Spotify clone built with Next.js, React, and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <PlaylistProvider>
          {children}
        </PlaylistProvider>
      </body>
    </html>
  );
}