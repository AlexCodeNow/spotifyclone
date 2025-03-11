'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaSearch, FaPlus, FaSpinner, FaCheck } from 'react-icons/fa';
import { useNotificationStore } from '@/components/ui/Notification';
import { spotifyApiHelpers } from '@/lib/api';

interface Track {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  album: {
    id: string;
    name: string;
    images: {
      url: string;
    }[];
  };
  uri: string;
  duration_ms: number;
}

interface AddTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  onTracksAdded: () => void;
}

export default function AddTracksModal({ 
  isOpen, 
  onClose, 
  playlistId, 
  onTracksAdded 
}: AddTracksModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingTracks, setIsAddingTracks] = useState(false);
  
  const { showNotification } = useNotificationStore();
  
  if (!isOpen) return null;
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await spotifyApiHelpers.search(searchQuery, ['track'], 20);
      setSearchResults(response.tracks.items);
    } catch (error) {
      console.error('Error searching tracks:', error);
      showNotification('error', 'Error al buscar canciones. Por favor, inténtalo de nuevo.', 3000);
    } finally {
      setIsSearching(false);
    }
  };
  
  const toggleTrackSelection = (track: Track) => {
    const isSelected = selectedTracks.some(t => t.id === track.id);
    
    if (isSelected) {
      setSelectedTracks(selectedTracks.filter(t => t.id !== track.id));
    } else {
      setSelectedTracks([...selectedTracks, track]);
    }
  };
  
  const handleAddTracks = async () => {
    if (selectedTracks.length === 0) {
      showNotification('error', 'Selecciona al menos una canción para añadir a la playlist.', 3000);
      return;
    }
    
    setIsAddingTracks(true);
    
    try {
      const trackUris = selectedTracks.map(track => track.uri);
      await spotifyApiHelpers.addTracksToPlaylist(playlistId, trackUris);
      
      showNotification('success', `${selectedTracks.length} canciones añadidas a la playlist.`, 3000);
      onTracksAdded();
      onClose();
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      showNotification('error', 'Error al añadir canciones a la playlist.', 3000);
    } finally {
      setIsAddingTracks(false);
    }
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-neutral-900 rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Añadir canciones</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canciones..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors"
              disabled={isSearching}
            >
              {isSearching ? (
                <FaSpinner className="animate-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>
        </form>
        
        {selectedTracks.length > 0 && (
          <div className="mb-4 p-2 bg-green-800 bg-opacity-30 rounded-md text-sm">
            <span className="font-medium">{selectedTracks.length} canciones seleccionadas</span>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mb-4">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <FaSpinner className="animate-spin text-green-500" size={24} />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((track) => {
                const isSelected = selectedTracks.some(t => t.id === track.id);
                
                return (
                  <div 
                    key={track.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-800 bg-opacity-30' : 'hover:bg-neutral-800'
                    }`}
                    onClick={() => toggleTrackSelection(track)}
                  >
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      <Image
                        src={track.album.images[0]?.url || '/placeholder-album.png'}
                        alt={track.album.name}
                        width={40}
                        height={40}
                        className="rounded-sm"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{track.name}</div>
                      <div className="text-gray-400 text-sm truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </div>
                    </div>
                    
                    <div className="ml-2 text-sm text-gray-400">
                      {formatDuration(track.duration_ms)}
                    </div>
                    
                    <div className="ml-4 text-green-500">
                      {isSelected ? (
                        <FaCheck size={16} />
                      ) : (
                        <FaPlus size={16} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center text-gray-400 py-8">
              No se encontraron resultados para "{searchQuery}"
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Busca canciones para añadir a tu playlist
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-600 text-white hover:border-white transition-colors"
            disabled={isAddingTracks}
          >
            Cancelar
          </button>
          <button
            onClick={handleAddTracks}
            className="px-6 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-green-700 disabled:opacity-70"
            disabled={isAddingTracks || selectedTracks.length === 0}
          >
            {isAddingTracks ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Añadiendo...
              </>
            ) : (
              'Añadir a la playlist'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}