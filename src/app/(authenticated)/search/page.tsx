'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { FaSearch } from 'react-icons/fa';
import MediaCard from '@/components/cards/MediaCard';
import TrackList from '@/components/tracks/TrackList';
import { Track } from '@/stores/player-store';
import SearchContainer from '@/components/layout/SearchContainer';

interface SearchResults {
  tracks: Track[];
  artists: any[];
  albums: any[];
  playlists: any[];
}

const INITIAL_RESULTS: SearchResults = {
  tracks: [],
  artists: [],
  albums: [],
  playlists: []
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResults>(INITIAL_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!query) {
      fetchBrowseCategories();
      return;
    }
    
    setSearchQuery(query);
    performSearch(query);
  }, [query]);
  
  const fetchBrowseCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/browse/categories?limit=20', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(INITIAL_RESULTS);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error loading categories');
    } finally {
      setIsLoading(false);
    }
  };
  
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults({
          tracks: data.tracks.items,
          artists: data.artists.items,
          albums: data.albums.items,
          playlists: data.playlists.items
        });
      } else {
        throw new Error('Failed to search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error performing search');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const hasResults = 
    results.tracks.length > 0 || 
    results.artists.length > 0 || 
    results.albums.length > 0 || 
    results.playlists.length > 0;
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center my-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => performSearch(query)}
            className="px-4 py-2 bg-green-500 text-white rounded-full"
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    if (!query) {
      return (
        <div className="my-8">
          <h2 className="text-2xl font-bold mb-6">Explorar categorías</h2>
        </div>
      );
    }
    
    if (query && !hasResults) {
      return (
        <div className="text-center my-12">
          <h3 className="text-xl mb-2">No se encontraron resultados para "{query}"</h3>
          <p className="text-gray-400">
            Verifica la ortografía o intenta con diferentes palabras.
          </p>
        </div>
      );
    }
    
    return (
      <div className="my-8">
        <div className="mb-6 border-b border-gray-800">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 font-medium relative ${
                activeTab === 'all' 
                  ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todo
            </button>
            {results.artists.length > 0 && (
              <button 
                onClick={() => setActiveTab('artists')}
                className={`py-2 px-1 font-medium relative ${
                  activeTab === 'artists' 
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Artistas
              </button>
            )}
            {results.albums.length > 0 && (
              <button 
                onClick={() => setActiveTab('albums')}
                className={`py-2 px-1 font-medium relative ${
                  activeTab === 'albums' 
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Álbumes
              </button>
            )}
            {results.tracks.length > 0 && (
              <button 
                onClick={() => setActiveTab('tracks')}
                className={`py-2 px-1 font-medium relative ${
                  activeTab === 'tracks' 
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Canciones
              </button>
            )}
            {results.playlists.length > 0 && (
              <button 
                onClick={() => setActiveTab('playlists')}
                className={`py-2 px-1 font-medium relative ${
                  activeTab === 'playlists' 
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Playlists
              </button>
            )}
          </div>
        </div>
        
        {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Artistas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.artists.slice(0, activeTab === 'all' ? 5 : undefined).map((artist) => (
                artist && (
                  <MediaCard
                    key={artist.id}
                    id={artist.id}
                    type="artist"
                    imageUrl={artist.images[0]?.url || '/placeholder-artist.png'}
                    title={artist.name}
                    subtitle="Artista"
                    href={`/artist/${artist.id}`}
                  />
                )
              ))}
            </div>
          </div>
        )}
        
        {(activeTab === 'all' || activeTab === 'albums') && results.albums.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Álbumes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.albums.slice(0, activeTab === 'all' ? 5 : undefined).map((album) => (
                album && (
                  <MediaCard
                    key={album.id}
                    id={album.id}
                    type="album"
                    imageUrl={album.images[0]?.url || '/placeholder-album.png'}
                    title={album.name}
                    subtitle={album.artists && album.artists[0] ? album.artists[0].name : ''}
                    href={`/album/${album.id}`}
                  />
                )
              ))}
            </div>
          </div>
        )}
        
        {(activeTab === 'all' || activeTab === 'playlists') && results.playlists.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.playlists.slice(0, activeTab === 'all' ? 5 : undefined).map((playlist) => (
                playlist && (
                  <MediaCard
                    key={playlist.id}
                    id={playlist.id}
                    type="playlist"
                    imageUrl={playlist.images[0]?.url || '/placeholder-playlist.png'}
                    title={playlist.name}
                    subtitle={playlist.owner?.display_name || 'Spotify'}
                    href={`/playlist/${playlist.id}`}
                  />
                )
              ))}
            </div>
          </div>
        )}
        
        {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Canciones</h2>
            <TrackList
              tracks={activeTab === 'all' ? results.tracks.slice(0, 5) : results.tracks}
              showAlbum={true}
              showArtist={true}
              showLikeButton={true}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <SearchContainer>
      <div className="pb-20">
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <FaSearch className="absolute top-3 left-4 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="¿Qué quieres escuchar?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 rounded-full bg-[#2A2A2A] hover:bg-[#323232] text-white focus:outline-none focus:ring-2 focus:ring-white"
            />
          </form>
        </div>
        
        {renderContent()}
      </div>
    </SearchContainer>
  );
}