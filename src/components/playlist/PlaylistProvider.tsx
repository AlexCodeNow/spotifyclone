'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal';
import EditPlaylistModal from '@/components/playlist/EditPlaylistModal';
import AddTracksModal from '@/components/playlist/AddTracksModal';

interface PlaylistContextType {
  openCreatePlaylistModal: () => void;
  openEditPlaylistModal: (playlistId: string) => void;
  openAddTracksModal: (playlistId: string) => void;
  refreshUserPlaylists: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylist = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist debe ser usado dentro de un PlaylistProvider');
  }
  return context;
};

interface PlaylistProviderProps {
  children: ReactNode;
}

export function PlaylistProvider({ children }: PlaylistProviderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTracksModalOpen, setIsAddTracksModalOpen] = useState(false);
  const [editPlaylistId, setEditPlaylistId] = useState<string>('');
  const [addTracksPlaylistId, setAddTracksPlaylistId] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const openCreatePlaylistModal = () => {
    setIsCreateModalOpen(true);
  };
  
  const openEditPlaylistModal = (playlistId: string) => {
    setEditPlaylistId(playlistId);
    setIsEditModalOpen(true);
  };
  
  const openAddTracksModal = (playlistId: string) => {
    setAddTracksPlaylistId(playlistId);
    setIsAddTracksModalOpen(true);
  };
  
  const handlePlaylistUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const refreshUserPlaylists = () => {
    handlePlaylistUpdated();
  };
  
  return (
    <PlaylistContext.Provider
      value={{
        openCreatePlaylistModal,
        openEditPlaylistModal,
        openAddTracksModal,
        refreshUserPlaylists
      }}
    >
      {children}
      
      <CreatePlaylistModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onPlaylistCreated={handlePlaylistUpdated}
      />
      
      <EditPlaylistModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        playlistId={editPlaylistId}
        onPlaylistUpdated={handlePlaylistUpdated}
      />
      
      <AddTracksModal
        isOpen={isAddTracksModalOpen}
        onClose={() => setIsAddTracksModalOpen(false)}
        playlistId={addTracksPlaylistId}
        onTracksAdded={handlePlaylistUpdated}
      />
    </PlaylistContext.Provider>
  );
}