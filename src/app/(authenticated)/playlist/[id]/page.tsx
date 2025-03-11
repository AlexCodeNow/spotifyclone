'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { usePlayerStore, Track } from '@/stores/player-store';
import { usePlaylist } from '@/components/playlist/PlaylistProvider';
import AddTracksModal from '@/components/playlist/AddTracksModal';
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaEllipsisH, FaUsers, FaClock, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useNotificationStore } from '@/components/ui/Notification';
import { spotifyApiHelpers } from '@/lib/api';

interface PlaylistTrack {
  track: Track;
  added_at: string;
  added_by: {
    id: string;
    display_name: string;
  };
}

interface PlaylistDetails {
  id: string;
  name: string;
  description: string;
  images: {
    url: string;
  }[];
  owner: {
    id: string;
    display_name: string;
  };
  followers: {
    total: number;
  };
  tracks: {
    items: PlaylistTrack[];
    total: number;
    next: string | null;
  };
  public: boolean;
  collaborative: boolean;
  snapshot_id: string;
}

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAddTracksModalOpen, setIsAddTracksModalOpen] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isRemovingTracks, setIsRemovingTracks] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  
  const { currentTrack, playback, playContext, playTrack, setIsPlaying } = usePlayerStore();
  const { user } = useAuthStore();
  const { openEditPlaylistModal } = usePlaylist();
  const { showNotification } = useNotificationStore();
  
  const isPlaylistOwner = user && playlist && playlist.owner.id === user.id;
  
  const isThisPlaying = 
    usePlayerStore.getState().currentContext.type === 'playlist' &&
    usePlayerStore.getState().currentContext.id === params.id &&
    playback.isPlaying;
  
  const fetchPlaylistData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const playlistId = params.id ? 
        (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : '';
      
      if (!playlistId) {
        throw new Error('Playlist ID is missing or invalid');
      }
      
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        }
      );
      
      if (!playlistResponse.ok) {
        throw new Error('Failed to fetch playlist data');
      }
      
      const playlistData = await playlistResponse.json();
      setPlaylist(playlistData);
      
      const validTracks = playlistData.tracks.items
        .filter((item: PlaylistTrack) => item.track !== null)
        .map((item: PlaylistTrack) => item.track);
      
      setTracks(validTracks);
      
      if (user) {
        const checkFollowResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/followers/contains?ids=${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }
        );
        
        if (checkFollowResponse.ok) {
          const followData = await checkFollowResponse.json();
          setIsSaved(followData[0] === true);
        }
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setError('Failed to load playlist. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPlaylistData();
  }, [params.id, user]);
  
  const loadMoreTracks = async () => {
    if (!playlist || !playlist.tracks.next) return;
    
    setIsLoadingMore(true);
    
    try {
      const nextTracksResponse = await fetch(playlist.tracks.next, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (nextTracksResponse.ok) {
        const nextTracksData = await nextTracksResponse.json();
        
        const newTracks = nextTracksData.items
          .filter((item: PlaylistTrack) => item.track !== null)
          .map((item: PlaylistTrack) => item.track);
        
        setTracks(prevTracks => [...prevTracks, ...newTracks]);
        
        setPlaylist(prevPlaylist => {
          if (!prevPlaylist) return null;
          
          return {
            ...prevPlaylist,
            tracks: {
              ...prevPlaylist.tracks,
              next: nextTracksData.next,
              items: [...prevPlaylist.tracks.items, ...nextTracksData.items]
            }
          };
        });
      }
    } catch (err) {
      console.error('Error loading more tracks:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const togglePlayPlaylist = () => {
    if (isThisPlaying) {
      setIsPlaying(false);
    } else {
      playContext('playlist', params.id);
    }
  };
  
  const toggleFollowPlaylist = async () => {
    const playlistId = params.id ? 
      (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : '';
    
    if (!playlistId) {
      console.error('Playlist ID is missing or invalid');
      return;
    }
    
    try {
      const method = isSaved ? 'DELETE' : 'PUT';
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        }
      );
      
      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error('Error toggling follow playlist:', err);
    }
  };
  
  const handleEditPlaylist = () => {
    openEditPlaylistModal(params.id);
    setShowMenu(false);
  };
  
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedTracks([]);
  };
  
  const handleRemoveTracks = async () => {
    if (!selectedTracks.length) return;
    
    setIsRemovingTracks(true);
    try {
      const trackUris = selectedTracks.map(trackId => {
        const track = tracks.find(t => t.id === trackId);
        return track ? track.uri : '';
      }).filter(uri => uri !== '');
      
      await spotifyApiHelpers.removeTracksFromPlaylist(params.id, trackUris);
      
      showNotification('success', `${selectedTracks.length} canciones eliminadas de la playlist.`, 3000);
      
      fetchPlaylistData();
      setSelectedTracks([]);
      setDeleteMode(false);
    } catch (error) {
      console.error('Error removing tracks:', error);
      showNotification('error', 'Error al eliminar canciones de la playlist.', 3000);
    } finally {
      setIsRemovingTracks(false);
    }
  };
  
  const handleTrackClick = (track: Track) => {
    if (deleteMode) {
      toggleTrackSelection(track.id);
    } else {
      playTrack(track, { type: 'playlist', id: params.id });
    }
  };
  
  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };
  
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error || !playlist) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Playlist not found'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-white rounded-full"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <div className="pb-24">
      {/* Modal para añadir canciones */}
      <AddTracksModal 
        isOpen={isAddTracksModalOpen}
        onClose={() => setIsAddTracksModalOpen(false)}
        playlistId={params.id}
        onTracksAdded={fetchPlaylistData}
      />
      
      <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 shadow-lg relative">
          {playlist.images && playlist.images.length > 0 ? (
            <Image
              src={playlist.images[0].url}
              alt={playlist.name}
              width={224}
              height={224}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              <span className="text-4xl text-neutral-400">🎵</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col text-center md:text-left">
          <span className="text-xs uppercase font-bold">Playlist</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-1 mb-2">{playlist.name}</h1>
          
          {playlist.description && (
            <p 
              className="text-gray-300 text-sm mb-2"
              dangerouslySetInnerHTML={{ __html: playlist.description }}
            ></p>
          )}
          
          <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-300 mt-1">
            <Link 
              href={`/user/${playlist.owner.id}`}
              className="hover:underline font-medium"
            >
              {playlist.owner.display_name}
            </Link>
            
            <span className="mx-1">•</span>
            
            <span>
              {playlist.followers.total > 0 && (
                <>
                  <span className="font-medium">{formatFollowers(playlist.followers.total)}</span> me gusta
                </>
              )}
            </span>
            
            <span className="mx-1">•</span>
            
            <span>{playlist.tracks.total} canciones</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={togglePlayPlaylist}
          className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          aria-label={isThisPlaying ? 'Pause' : 'Play'}
        >
          {isThisPlaying ? (
            <FaPause className="text-black text-xl" />
          ) : (
            <FaPlay className="text-black text-xl ml-1" />
          )}
        </button>
        
        {!isPlaylistOwner && (
          <button
            onClick={toggleFollowPlaylist}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={isSaved ? 'Remove from Your Library' : 'Save to Your Library'}
          >
            {isSaved ? (
              <FaHeart className="text-green-500 text-2xl" />
            ) : (
              <FaRegHeart className="text-2xl" />
            )}
          </button>
        )}
        
        {/* Menú de opciones */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="More options"
          >
            <FaEllipsisH className="text-xl" />
          </button>
          
          {showMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-20">
              {isPlaylistOwner && (
                <>
                  <button 
                    onClick={handleEditPlaylist}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700"
                  >
                    <FaEdit className="mr-2" />
                    Editar detalles
                  </button>
                </>
              )}
              
              <button 
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700"
              >
                <FaUsers className="mr-2" />
                Ver seguidores
              </button>
              
              {/* Más opciones según permisos */}
            </div>
          )}
        </div>
      </div>
      
      {isPlaylistOwner && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setIsAddTracksModalOpen(true)}
            className={`flex items-center text-white px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors ${
              deleteMode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={deleteMode}
          >
            <FaPlus className="mr-2" />
            Añadir canciones
          </button>
          
          {tracks.length > 0 && (
            <button
              onClick={toggleDeleteMode}
              className={`flex items-center px-4 py-2 rounded-full transition-colors ${
                deleteMode 
                  ? 'bg-red-700 text-white hover:bg-red-800' 
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              {deleteMode ? (
                <>
                  <FaTimes className="mr-2" />
                  Cancelar eliminación
                </>
              ) : (
                <>
                  <FaTrash className="mr-2" />
                  Eliminar canciones
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {deleteMode && selectedTracks.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-red-900 bg-opacity-30 border border-red-800 rounded-md flex items-center justify-between">
          <div>
            <span className="font-medium">{selectedTracks.length} canciones seleccionadas</span>
          </div>
          
          <button 
            onClick={handleRemoveTracks}
            className="flex items-center text-white px-4 py-1 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            disabled={isRemovingTracks}
          >
            {isRemovingTracks ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Eliminando...
              </div>
            ) : (
              <>
                <FaTrash className="mr-2" />
                Eliminar seleccionadas
              </>
            )}
          </button>
        </div>
      )}
      
      {tracks.length > 0 ? (
        <div className="mb-8">
          <div className="w-full">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-3 w-12 text-center">#</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Artist</th>
                  <th className="pb-3">Album</th>
                  <th className="pb-3 text-right pr-4">
                    <span className="sr-only">Duration</span>
                    <FaClock size={14} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => {
                  const isPlaying = currentTrack?.id === track.id && playback.isPlaying;
                  const isSelected = selectedTracks.includes(track.id);
                  
                  return (
                    <tr 
                      key={track.id}
                      className={`group cursor-pointer hover:bg-neutral-800 ${
                        isPlaying ? 'bg-neutral-700 bg-opacity-50' : ''
                      } ${isSelected && deleteMode ? 'bg-red-900 bg-opacity-30' : ''}`}
                      onClick={() => handleTrackClick(track)}
                    >
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center h-6 w-6">
                          {isSelected && deleteMode ? (
                            <FaCheck className="text-red-500" size={12} />
                          ) : (
                            <span className={`text-sm ${isPlaying ? 'text-green-500' : 'text-gray-400'}`}>
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 mr-3 flex-shrink-0">
                            <Image
                              src={track.album.images[0]?.url || '/placeholder-album.png'}
                              alt={track.album.name}
                              width={40}
                              height={40}
                              className="rounded-sm"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <div className={`truncate font-medium ${isPlaying ? 'text-green-500' : 'text-white'}`}>
                              {track.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="truncate text-gray-400 hover:text-white">
                          {track.artists.map((artist, i) => (
                            <span key={artist.id}>
                              <Link 
                                href={`/artist/${artist.id}`} 
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()} // Evitar que active la selección/reproducción
                              >
                                {artist.name}
                              </Link>
                              {i < track.artists.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="truncate text-gray-400 hover:text-white">
                          <Link 
                            href={`/album/${track.album.id}`} 
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()} // Evitar que active la selección/reproducción
                          >
                            {track.album.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end">
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
          
          {playlist.tracks.next && (
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
          <p className="mb-4">Esta playlist no tiene canciones aún.</p>
          
          {isPlaylistOwner && (
            <button
              onClick={() => setIsAddTracksModalOpen(true)}
              className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center mx-auto"
            >
              <FaPlus className="mr-2" />
              Añadir canciones
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}