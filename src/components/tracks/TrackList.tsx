'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlay, FaPause, FaHeart, FaRegHeart } from 'react-icons/fa';
import { usePlayerStore, Track } from '@/stores/player-store';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/components/ui/Notification';

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showArtist?: boolean;
  context?: {
    type: 'album' | 'playlist' | 'artist' | 'collection';
    id: string;
  };
  showLikeButton?: boolean;
  onDataChanged?: () => void;
}

export default function TrackList({
  tracks,
  showAlbum = true,
  showArtist = true,
  context,
  showLikeButton = true,
  onDataChanged
}: TrackListProps) {
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [isProcessingLike, setIsProcessingLike] = useState<string | null>(null);
  
  const { currentTrack, playback, playTrack } = usePlayerStore();
  const { showNotification } = useNotificationStore();
  
  useEffect(() => {
    if (showLikeButton && tracks.length > 0) {
      checkSavedTracks();
    }
  }, [tracks, showLikeButton]);
  
  const checkSavedTracks = async () => {
    try {
      const trackIds = tracks.map(track => track.id);
      const batches = [];
      
      for (let i = 0; i < trackIds.length; i += 50) {
        batches.push(trackIds.slice(i, i + 50));
      }
      
      for (const batch of batches) {
        const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${batch.join(',')}`, {
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        });
        
        if (response.ok) {
          const savedData = await response.json();
          
          setLikedTracks(prev => {
            const newState = { ...prev };
            batch.forEach((id, index) => {
              newState[id] = savedData[index];
            });
            return newState;
          });
        }
      }
    } catch (error) {
      console.error('Error checking saved tracks:', error);
    }
  };
  
  const toggleLike = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    
    if (isProcessingLike) return;
    
    setIsProcessingLike(trackId);
    
    try {
      const isCurrentlyLiked = likedTracks[trackId] || false;
      const method = isCurrentlyLiked ? 'DELETE' : 'PUT';
      
      const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (response.ok) {
        setLikedTracks(prev => ({
          ...prev,
          [trackId]: !isCurrentlyLiked
        }));
        
        showNotification(
          'success', 
          isCurrentlyLiked ? 'Canción eliminada de favoritos' : 'Canción añadida a favoritos', 
          2000
        );
        
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        throw new Error('Failed to update track like status');
      }
    } catch (error) {
      console.error('Error toggling track like:', error);
      showNotification('error', 'Error al actualizar la canción favorita', 3000);
    } finally {
      setIsProcessingLike(null);
    }
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-3 w-12 text-center">#</th>
            <th className="pb-3">Title</th>
            {showArtist && <th className="pb-3">Artist</th>}
            {showAlbum && <th className="pb-3">Album</th>}
            <th className="pb-3 text-right pr-4">
              <span className="sr-only">Duration</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V8.5L11.5 10.5M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const isPlaying = currentTrack?.id === track.id && playback.isPlaying;
            const isHovered = hoveredTrackId === track.id;
            const isLiked = likedTracks[track.id] || false;
            const isProcessingThisTrack = isProcessingLike === track.id;
            
            return (
              <tr 
                key={track.id}
                className={`group hover:bg-neutral-800 ${
                  isPlaying ? 'bg-neutral-700 bg-opacity-50' : ''
                }`}
                onMouseEnter={() => setHoveredTrackId(track.id)}
                onMouseLeave={() => setHoveredTrackId(null)}
              >
                <td className="py-3 px-2 text-center">
                  {isHovered || isPlaying ? (
                    <button
                      onClick={() => playTrack(track, context)}
                      className="w-6 h-6 flex items-center justify-center"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <FaPause className="text-white" size={12} />
                      ) : (
                        <FaPlay className="text-white" size={12} />
                      )}
                    </button>
                  ) : (
                    <span className={`text-sm ${isPlaying ? 'text-green-500' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 mr-3 flex-shrink-0 bg-neutral-800 rounded-sm flex items-center justify-center">
                      {track.album?.images?.[0]?.url ? (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album?.name || track.name}
                          className="w-10 h-10 rounded-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex items-center justify-center w-full h-full text-xs text-gray-400">
                                  ${track.name.substring(0, 1).toUpperCase()}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="text-xs text-gray-400">
                          {track.name.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className={`truncate font-medium ${isPlaying ? 'text-green-500' : 'text-white'}`}>
                        {track.name}
                      </div>
                    </div>
                  </div>
                </td>
                {showArtist && (
                  <td className="py-3">
                    <div className="truncate text-gray-400 hover:text-white">
                      {track.artists.map((artist, i) => (
                        <span key={artist.id}>
                          <Link href={`/artist/${artist.id}`} className="hover:underline">
                            {artist.name}
                          </Link>
                          {i < track.artists.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
                {showAlbum && track.album && (
                  <td className="py-3">
                    <div className="truncate text-gray-400 hover:text-white">
                      <Link href={`/album/${track.album.id}`} className="hover:underline">
                        {track.album.name}
                      </Link>
                    </div>
                  </td>
                )}
                {showAlbum && !track.album && (
                  <td className="py-3">
                    <div className="truncate text-gray-400">
                      -
                    </div>
                  </td>
                )}
                <td className="py-3 pr-4 text-right">
                  <div className="flex items-center justify-end">
                    {showLikeButton && (
                      <button
                        onClick={(e) => toggleLike(e, track.id)}
                        className={`mr-3 ${isProcessingThisTrack 
                          ? 'opacity-50' 
                          : isHovered || isLiked 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        } transition-opacity ${
                          isLiked ? 'text-green-500' : 'text-gray-400 hover:text-white'
                        }`}
                        aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                        disabled={isProcessingThisTrack}
                      >
                        {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                      </button>
                    )}
                    <span className="text-sm text-gray-400">
                      {formatDuration(track.duration_ms)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}