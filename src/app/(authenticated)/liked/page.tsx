'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usePlayerStore, Track } from '@/stores/player-store';
import { FaHeart, FaPlay, FaPause } from 'react-icons/fa';
import TrackList from '@/components/tracks/TrackList';
import { useNotificationStore } from '@/components/ui/Notification';

export default function LikedSongsPage() {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalTracks, setTotalTracks] = useState(0);
  
  const { currentTrack, playback, playContext, setIsPlaying } = usePlayerStore();
  const { showNotification } = useNotificationStore();
  
  const isThisPlaying = 
    usePlayerStore.getState().currentContext.type === 'collection' &&
    usePlayerStore.getState().currentContext.id === 'liked-songs' &&
    playback.isPlaying;
  
  const fetchLikedTracks = async (url?: string) => {
    if (!url) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const endpoint = url || 'https://api.spotify.com/v1/me/tracks?limit=50';
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch liked tracks');
      }
      
      const data = await response.json();
      const tracks = data.items.map((item: any) => item.track);
      
      if (url) {
        setLikedTracks(prev => [...prev, ...tracks]);
      } else {
        setLikedTracks(tracks);
      }
      
      setTotalTracks(data.total);
      setHasNextPage(!!data.next);
      setNextPageUrl(data.next);
      setError(null);
    } catch (err) {
      console.error('Error fetching liked tracks:', err);
      setError('Error al cargar tus canciones favoritas. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  useEffect(() => {
    fetchLikedTracks();
  }, []);
  
  const loadMoreTracks = () => {
    if (nextPageUrl) {
      fetchLikedTracks(nextPageUrl);
    }
  };
  
  const togglePlayCollection = () => {
    if (isThisPlaying) {
      setIsPlaying(false);
    } else {
      if (likedTracks.length === 0) {
        showNotification('info', 'No hay canciones favoritas para reproducir', 3000);
        return;
      }
      
      playContext('collection', 'liked-songs', likedTracks);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => fetchLikedTracks()}
          className="px-4 py-2 bg-green-500 text-white rounded-full"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <div className="pb-24">
      <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 shadow-lg relative overflow-hidden bg-gradient-to-br from-purple-700 to-purple-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <FaHeart className="text-white w-24 h-24 opacity-30" />
          </div>
        </div>
        
        <div className="flex flex-col text-center md:text-left">
          <span className="text-xs uppercase font-bold">Playlist</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-1 mb-2">Canciones que te gustan</h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-300 mt-1">
            <span className="font-medium">{totalTracks} canciones</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={togglePlayCollection}
          className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          aria-label={isThisPlaying ? 'Pause' : 'Play'}
          disabled={likedTracks.length === 0}
        >
          {isThisPlaying ? (
            <FaPause className="text-black text-xl" />
          ) : (
            <FaPlay className="text-black text-xl ml-1" />
          )}
        </button>
      </div>
      
      {likedTracks.length > 0 ? (
        <div className="mb-8">
          <TrackList
            tracks={likedTracks}
            showAlbum={true}
            showArtist={true}
            context={{ type: 'collection', id: 'liked-songs' }}
            showLikeButton={true}
            onDataChanged={fetchLikedTracks}
          />
          
          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreTracks}
                disabled={isLoadingMore}
                className="px-6 py-2 text-white font-medium rounded-full border border-gray-400 hover:border-white transition-colors"
              >
                {isLoadingMore ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Cargando...
                  </span>
                ) : (
                  'Cargar más canciones'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-4">No has añadido canciones a tus favoritos aún.</p>
          <p>Explora nuevas canciones y dale like a las que te gusten.</p>
        </div>
      )}
    </div>
  );
}