'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import { spotifyApiHelpers } from '@/lib/api';
import { usePlaylist } from '@/components/playlist/PlaylistProvider';
import { 
  FaHome, 
  FaSearch, 
  FaBook, 
  FaPlus, 
  FaHeart, 
  FaSpotify,
  FaEllipsisH
} from 'react-icons/fa';

interface PlaylistType {
  id: string;
  name: string;
  images: { url: string }[];
}

export default function Sidebar({ currentPath }: { currentPath: string }) {
  const [userPlaylists, setUserPlaylists] = useState<PlaylistType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePlaylistMenu, setActivePlaylistMenu] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, playlistId: string | null, playlistName: string}>({
    show: false,
    playlistId: null,
    playlistName: ''
  });
  
  const { user } = useAuthStore();
  const { openCreatePlaylistModal, openEditPlaylistModal } = usePlaylist();
  
  const refreshPlaylists = async () => {
    setIsLoading(true);
    try {
      const playlistsData = await spotifyApiHelpers.getUserPlaylists();
      setUserPlaylists(playlistsData.items);
    } catch (error) {
      console.error('Error fetching user playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      refreshPlaylists();
    };
    
    window.addEventListener('playlist-updated', handlePlaylistUpdate);
    
    refreshPlaylists();
    
    return () => {
      window.removeEventListener('playlist-updated', handlePlaylistUpdate);
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePlaylistMenu) {
        const target = event.target as Element;
        if (!target.closest('.playlist-menu') && !target.closest('.playlist-menu-button')) {
          setActivePlaylistMenu(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePlaylistMenu]);
  
  const handleCreatePlaylist = () => {
    openCreatePlaylistModal();
  };
  
  const togglePlaylistMenu = (playlistId: string) => {
    setActivePlaylistMenu(activePlaylistMenu === playlistId ? null : playlistId);
  };
  
  const handleEditPlaylist = (playlistId: string) => {
    openEditPlaylistModal(playlistId);
    setActivePlaylistMenu(null);
  };
  
  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    setDeleteConfirmation({
      show: true,
      playlistId,
      playlistName
    });
    setActivePlaylistMenu(null);
  };
  
  const confirmDeletePlaylist = async () => {
    if (!deleteConfirmation.playlistId) return;
    
    try {
      const success = await spotifyApiHelpers.deletePlaylist(deleteConfirmation.playlistId);
      
      if (success) {
        refreshPlaylists();
        
        window.dispatchEvent(new Event('playlist-updated'));
      } else {
        console.error('Error al eliminar la playlist');
      }
    } catch (error) {
      console.error('Error eliminando playlist:', error);
    } finally {
      setDeleteConfirmation({
        show: false,
        playlistId: null,
        playlistName: ''
      });
    }
  };
  
  const navItems = [
    { name: 'Home', icon: <FaHome size={22} />, path: '/home' },
    { name: 'Search', icon: <FaSearch size={22} />, path: '/search' },
    { name: 'Your Library', icon: <FaBook size={22} />, path: '/library' },
  ];

  return (
    <div className="w-64 bg-black flex flex-col h-full">
      <div className="p-6">
        <Link href="/home" className="flex items-center">
          <FaSpotify className="text-white mr-2" size={32} />
          <span className="text-white text-xl font-bold">Spotify</span>
        </Link>
      </div>
      
      <nav className="mb-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.path}
                className={`flex items-center px-6 py-3 text-sm font-semibold transition-colors ${
                  currentPath === item.path
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="mr-4">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <button 
            className="flex items-center text-gray-400 hover:text-white text-sm font-semibold p-2"
            onClick={handleCreatePlaylist}
          >
            <FaPlus className="mr-2" />
            Create Playlist
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Link 
            href="/liked" 
            className={`flex items-center text-sm font-semibold p-2 ${
              currentPath === '/liked'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaHeart className={`mr-2 ${currentPath === '/liked' ? 'text-green-500' : ''}`} />
            Liked Songs
          </Link>
        </div>
      </div>
      
      <div className="mx-6 my-2 border-t border-gray-800"></div>
      
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
          </div>
        ) : (
          <ul className="space-y-1">
            {userPlaylists.map((playlist) => (
              <li key={playlist.id} className="group relative">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/playlist/${playlist.id}`}
                    className={`flex-1 flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                      currentPath === `/playlist/${playlist.id}`
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {playlist.name}
                  </Link>
                  
                  <button 
                    className="playlist-menu-button opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white px-2 py-2"
                    onClick={() => togglePlaylistMenu(playlist.id)}
                    aria-label="Opciones de playlist"
                  >
                    <FaEllipsisH size={14} />
                  </button>
                </div>
                
                {activePlaylistMenu === playlist.id && (
                  <div className="playlist-menu absolute right-0 mt-1 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-20">
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700"
                      onClick={() => handleEditPlaylist(playlist.id)}
                    >
                      Editar detalles
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-700"
                      onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    >
                      Eliminar playlist
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {user && (
        <div className="p-4 border-t border-gray-800">
          <Link href="/profile" className="flex items-center">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-700 mr-2">
              {user.images && user.images.length > 0 ? (
                <Image 
                  src={user.images[0].url} 
                  alt={user.display_name} 
                  width={32} 
                  height={32} 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-xs">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white truncate">
              {user.display_name}
            </span>
          </Link>
        </div>
      )}
      
      {deleteConfirmation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-neutral-900 rounded-lg w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">¿Eliminar playlist?</h3>
            <p className="text-gray-300 mb-2">
              ¿Estás seguro que quieres eliminar la playlist <span className="font-semibold">{deleteConfirmation.playlistName}</span>?
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción no se puede deshacer. La playlist será eliminada de tu biblioteca.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, playlistId: null, playlistName: '' })}
                className="px-4 py-2 rounded-full border border-gray-600 text-white hover:border-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePlaylist}
                className="px-6 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}