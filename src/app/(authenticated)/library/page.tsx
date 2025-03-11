'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { FaMusic, FaCompactDisc, FaUser, FaHeart, FaEllipsisH } from 'react-icons/fa';
import MediaCard from '@/components/cards/MediaCard';
import TrackList from '@/components/tracks/TrackList';
import { Track } from '@/stores/player-store';

enum LibraryTab {
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums',
  ARTISTS = 'artists',
  TRACKS = 'tracks'
}

interface CollectionItem {
  id: string;
  type: 'album' | 'playlist' | 'artist' | 'track';
  name: string;
  images: { url: string }[];
  artists?: { id: string; name: string }[];
  owner?: { id: string; display_name: string };
  added_at?: string;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>(LibraryTab.PLAYLISTS);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { user } = useAuthStore();
  
  useEffect(() => {
    fetchLibraryItems();
  }, [activeTab]);
  
  const fetchLibraryItems = async (url?: string) => {
    if (!url) {
      setIsLoading(true);
      setItems([]);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);
    
    try {
      let endpoint = '';
      
      switch (activeTab) {
        case LibraryTab.PLAYLISTS:
          endpoint = url || 'https://api.spotify.com/v1/me/playlists?limit=20';
          break;
        case LibraryTab.ALBUMS:
          endpoint = url || 'https://api.spotify.com/v1/me/albums?limit=20';
          break;
        case LibraryTab.ARTISTS:
          endpoint = url || 'https://api.spotify.com/v1/me/following?type=artist&limit=20';
          break;
        case LibraryTab.TRACKS:
          endpoint = url || 'https://api.spotify.com/v1/me/tracks?limit=20';
          break;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching ${activeTab}`);
      }
      
      const data = await response.json();
      
      let processedItems: CollectionItem[] = [];
      let tracks: Track[] = [];
      
      switch (activeTab) {
        case LibraryTab.PLAYLISTS:
          processedItems = data.items.map((item: any) => ({
            ...item,
            type: 'playlist'
          }));
          break;
        
        case LibraryTab.ALBUMS:
          processedItems = data.items.map((item: any) => ({
            ...item.album,
            type: 'album',
            added_at: item.added_at
          }));
          break;
        
        case LibraryTab.ARTISTS:
          processedItems = data.artists.items.map((item: any) => ({
            ...item,
            type: 'artist'
          }));
          break;
        
        case LibraryTab.TRACKS:
          tracks = data.items.map((item: any) => item.track);
          processedItems = data.items.map((item: any) => ({
            ...item.track,
            type: 'track',
            added_at: item.added_at
          }));
          setLikedTracks(tracks);
          break;
      }
      
      if (url) {
        setItems(prevItems => [...prevItems, ...processedItems]);
      } else {
        setItems(processedItems);
      }
      
      setHasNextPage(!!data.next);
      setNextPageUrl(data.next);
      
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Error loading your ${activeTab}. Please try again later.`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const loadMore = () => {
    if (nextPageUrl) {
      fetchLibraryItems(nextPageUrl);
    }
  };
  
  const formatAddedDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };
  
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
            onClick={() => fetchLibraryItems()}
            className="px-4 py-2 bg-green-500 text-white rounded-full"
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    if (items.length === 0) {
      let emptyMessage = '';
      
      switch (activeTab) {
        case LibraryTab.PLAYLISTS:
          emptyMessage = 'No tienes playlists guardadas.';
          break;
        case LibraryTab.ALBUMS:
          emptyMessage = 'No tienes álbumes guardados.';
          break;
        case LibraryTab.ARTISTS:
          emptyMessage = 'No sigues a ningún artista.';
          break;
        case LibraryTab.TRACKS:
          emptyMessage = 'No tienes canciones favoritas.';
          break;
      }
      
      return (
        <div className="text-center my-12">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      );
    }
    
    if (activeTab === LibraryTab.TRACKS) {
      return (
        <div>
          <TrackList tracks={likedTracks} showAlbum={true} showArtist={true} />
          
          {/* Botón para cargar más */}
          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 text-white font-medium rounded-full border border-gray-400 hover:border-white transition-colors"
              >
                {isLoadingMore ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Cargando...
                  </span>
                ) : (
                  'Cargar más'
                )}
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              id={item.id}
              type={item.type}
              imageUrl={item.images?.[0]?.url || '/placeholder-image.png'}
              title={item.name}
              subtitle={
                item.type === 'playlist' 
                  ? item.owner?.display_name 
                  : item.type === 'album' 
                    ? item.artists?.map(a => a.name).join(', ')
                    : item.type === 'artist'
                      ? 'Artista'
                      : item.artists?.map(a => a.name).join(', ')
              }
              href={`/${item.type}/${item.id}`}
              data={item.type === 'track' ? item : undefined}
            />
          ))}
        </div>
        
        {hasNextPage && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="px-6 py-2 text-white font-medium rounded-full border border-gray-400 hover:border-white transition-colors"
            >
              {isLoadingMore ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                  Cargando...
                </span>
              ) : (
                'Cargar más'
              )}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="pb-20">
      <h1 className="text-3xl font-bold mb-6">Tu biblioteca</h1>
      
      <div className="mb-8">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab(LibraryTab.PLAYLISTS)}
            className={`px-4 py-2 rounded-full font-medium flex items-center whitespace-nowrap ${
              activeTab === LibraryTab.PLAYLISTS 
                ? 'bg-white text-black' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaMusic className="mr-2" />
            Playlists
          </button>
          
          <button
            onClick={() => setActiveTab(LibraryTab.ALBUMS)}
            className={`px-4 py-2 rounded-full font-medium flex items-center whitespace-nowrap ${
              activeTab === LibraryTab.ALBUMS 
                ? 'bg-white text-black' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaCompactDisc className="mr-2" />
            Álbumes
          </button>
          
          <button
            onClick={() => setActiveTab(LibraryTab.ARTISTS)}
            className={`px-4 py-2 rounded-full font-medium flex items-center whitespace-nowrap ${
              activeTab === LibraryTab.ARTISTS 
                ? 'bg-white text-black' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaUser className="mr-2" />
            Artistas
          </button>
          
          <button
            onClick={() => setActiveTab(LibraryTab.TRACKS)}
            className={`px-4 py-2 rounded-full font-medium flex items-center whitespace-nowrap ${
              activeTab === LibraryTab.TRACKS 
                ? 'bg-white text-black' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaHeart className="mr-2" />
            Canciones favoritas
          </button>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}