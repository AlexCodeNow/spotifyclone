// src/stores/player-store.ts
import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import { getDeviceId } from '@/lib/device-helper';

export interface Track {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
}

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  device_id: string | null;
}

interface PlayerState {
  currentTrack: Track | null;
  currentContext: {
    type: 'album' | 'playlist' | 'artist' | 'track' | 'collection' | null;
    id: string | null;
  };
  queue: Track[];
  history: Track[];
  playback: PlaybackState;
  
  isShuffled: boolean;
  repeatMode: 'off' | 'track' | 'context';
  isLoading: boolean;
  error: string | null;
  
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setContext: (type: 'album' | 'playlist' | 'artist' | 'track' | 'collection' | null, id: string | null) => void;
  playTrack: (track: Track, context?: { type: 'album' | 'playlist' | 'artist' | 'collection'; id: string }) => Promise<void>;
  playContext: (contextType: 'album' | 'playlist' | 'artist' | 'collection', contextId: string, tracksForCollection?: Track[]) => Promise<void>;
  playPause: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeatMode: () => void;
  clearError: () => void;
  addToQueue: (track: Track) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  currentContext: {
    type: null,
    id: null,
  },
  queue: [],
  history: [],
  playback: {
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 0.5,
    device_id: null,
  },
  isShuffled: false,
  repeatMode: 'off',
  isLoading: false,
  error: null,
  
  setCurrentTrack: (track) => set({ currentTrack: track }),
  
  setIsPlaying: (isPlaying) => set((state) => ({
    playback: { ...state.playback, isPlaying }
  })),
  
  setPosition: (position) => set((state) => ({
    playback: { ...state.playback, position }
  })),
  
  setDuration: (duration) => set((state) => ({
    playback: { ...state.playback, duration }
  })),
  
  setVolume: (volume) => set((state) => ({
    playback: { ...state.playback, volume }
  })),
  
  setContext: (type, id) => set({
    currentContext: { type, id }
  }),
  
  playTrack: async (track, context) => {
    set({ isLoading: true, error: null });
    try {
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        
        if (!deviceId) {
          console.log('No hay dispositivo disponible para reproducción. Intentando usar vista previa...');
          if (track.preview_url) {
            set({
              currentTrack: track,
              playback: {
                ...get().playback,
                isPlaying: true,
                position: 0,
                duration: track.duration_ms,
              }
            });
            
            if (context) {
              set({ currentContext: { type: context.type, id: context.id } });
            } else {
              set({ currentContext: { type: 'track', id: track.id } });
            }
            return;
          } else {
            throw new Error('No hay dispositivo disponible y la pista no tiene vista previa');
          }
        }
        
        try {
          if (context) {
            if (context.type === 'artist') {
              const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                  uris: [`spotify:track:${track.id}`],
                  position_ms: 0
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('Error reproduciendo pista de artista:', errorData);
                throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
              }
              
              set({ currentContext: { type: context.type, id: context.id } });
            } 
            else if (context.type === 'collection') {
              const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                  uris: [`spotify:track:${track.id}`],
                  position_ms: 0
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('Error reproduciendo pista de colección:', errorData);
                throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
              }
              
              set({ currentContext: { type: context.type, id: context.id } });
            }
            else {
              const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                  context_uri: `spotify:${context.type}:${context.id}`,
                  offset: { uri: `spotify:track:${track.id}` },
                  position_ms: 0
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('Error reproduciendo con contexto:', errorData);
                throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
              }
            }
          } else {
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              },
              body: JSON.stringify({
                uris: [`spotify:track:${track.id}`],
                position_ms: 0
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error reproduciendo pista:', errorData);
              throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
            }
          }
        } catch (apiError) {
          console.error('Error en API de Spotify:', apiError);
          
          if (track.preview_url) {
            console.log('Fallback a vista previa...');
            set({
              currentTrack: track,
              playback: {
                ...get().playback,
                isPlaying: true,
                position: 0,
                duration: track.duration_ms,
              }
            });
            
            if (context) {
              set({ currentContext: { type: context.type, id: context.id } });
            } else {
              set({ currentContext: { type: 'track', id: track.id } });
            }
            return;
          } else {
            throw apiError;
          }
        }
      } 
      else {
        if (!track.preview_url) {
          throw new Error('Esta pista no tiene vista previa disponible');
        }
        
        set({
          currentTrack: track,
          playback: {
            ...get().playback,
            isPlaying: true,
            position: 0,
            duration: track.duration_ms,
          }
        });
        
        if (context) {
          set({ currentContext: { type: context.type, id: context.id } });
        } else {
          set({ currentContext: { type: 'track', id: track.id } });
        }
      }
      
      set((state) => ({
        history: [track, ...state.history.slice(0, 19)]
      }));
      
    } catch (error) {
      console.error('Error playing track:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to play track' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  playContext: async (contextType, contextId, tracksForCollection) => {
    set({ isLoading: true, error: null });
    try {
      if (contextType === 'collection' && tracksForCollection && tracksForCollection.length > 0) {
        const firstTrack = tracksForCollection[0];
        
        if (useAuthStore.getState().isPremium) {
          const deviceId = getDeviceId();
          if (deviceId) {
            try {
              const trackUris = tracksForCollection.slice(0, 5).map(t => `spotify:track:${t.id}`);
              
              const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                  uris: trackUris,
                  position_ms: 0
                })
              });
              
              if (!response.ok) {
                throw new Error('Error reproduciendo colección');
              }
              
              set({
                currentTrack: firstTrack,
                currentContext: { type: 'collection', id: contextId },
                queue: tracksForCollection.slice(1)
              });
              
              return;
            } catch (error) {
              console.error('Error reproduciendo colección con API:', error);
            }
          }
        }
        
        const tracksWithPreview = tracksForCollection.filter(t => t.preview_url);
        if (tracksWithPreview.length > 0) {
          set({
            currentTrack: tracksWithPreview[0],
            queue: tracksWithPreview.slice(1),
            playback: {
              ...get().playback,
              isPlaying: true,
              position: 0,
              duration: tracksWithPreview[0].duration_ms,
            },
            currentContext: { type: 'collection', id: contextId }
          });
          return;
        } else {
          throw new Error('No hay pistas con vista previa disponible en esta colección');
        }
      }
      
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        
        if (!deviceId) {
          console.log('No hay dispositivo disponible para reproducción. Obteniendo pistas para vista previa...');
          let tracks: Track[] = [];
          
          if (contextType === 'album') {
            const response = await fetch(`https://api.spotify.com/v1/albums/${contextId}/tracks`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.items;
          } else if (contextType === 'playlist') {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${contextId}/tracks`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.items.map((item: any) => item.track);
          } else if (contextType === 'artist') {
            const response = await fetch(`https://api.spotify.com/v1/artists/${contextId}/top-tracks?market=from_token`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.tracks;
          }
          
          const tracksWithPreview = tracks.filter(track => track.preview_url);
          if (tracksWithPreview.length > 0) {
            set({
              currentTrack: tracksWithPreview[0],
              queue: tracksWithPreview.slice(1),
              playback: {
                ...get().playback,
                isPlaying: true,
                position: 0,
                duration: tracksWithPreview[0].duration_ms,
              },
              currentContext: { type: contextType, id: contextId }
            });
            return;
          } else {
            throw new Error('No hay pistas con vista previa disponible en este contexto');
          }
        }
        
        try {
          if (contextType === 'artist') {
            const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${contextId}/top-tracks?market=from_token`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            
            if (!topTracksResponse.ok) {
              throw new Error('Error al obtener las canciones principales del artista');
            }
            
            const topTracksData = await topTracksResponse.json();
            if (!topTracksData.tracks || topTracksData.tracks.length === 0) {
              throw new Error('No se encontraron canciones para este artista');
            }
            
            const firstTrack = topTracksData.tracks[0];
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              },
              body: JSON.stringify({
                uris: topTracksData.tracks.slice(0, 5).map((t: any) => `spotify:track:${t.id}`),
                position_ms: 0
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error reproduciendo artista:', errorData);
              throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
            }
            
            set({ currentContext: { type: 'artist', id: contextId } });
            
          } else {
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              },
              body: JSON.stringify({
                context_uri: `spotify:${contextType}:${contextId}`,
                position_ms: 0
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Error reproduciendo ${contextType}:`, errorData);
              throw new Error(`Error reproduciendo: ${errorData.error?.message || 'Error desconocido'}`);
            }
          }
        } catch (apiError) {
          console.error('Error en API de Spotify:', apiError);
          
          let tracks: Track[] = [];
          
          if (contextType === 'album') {
            const response = await fetch(`https://api.spotify.com/v1/albums/${contextId}/tracks`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.items;
          } else if (contextType === 'playlist') {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${contextId}/tracks`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.items.map((item: any) => item.track);
          } else if (contextType === 'artist') {
            const response = await fetch(`https://api.spotify.com/v1/artists/${contextId}/top-tracks?market=from_token`, {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            });
            const data = await response.json();
            tracks = data.tracks;
          }
          
          const tracksWithPreview = tracks.filter(track => track.preview_url);
          if (tracksWithPreview.length > 0) {
            set({
              currentTrack: tracksWithPreview[0],
              queue: tracksWithPreview.slice(1),
              playback: {
                ...get().playback,
                isPlaying: true,
                position: 0,
                duration: tracksWithPreview[0].duration_ms,
              },
              currentContext: { type: contextType, id: contextId }
            });
            return;
          } else {
            throw apiError;
          }
        }
      }
      else {
        let tracks: Track[] = [];
        
        if (contextType === 'album') {
          const response = await fetch(`https://api.spotify.com/v1/albums/${contextId}/tracks`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
          const data = await response.json();
          tracks = data.items;
        } else if (contextType === 'playlist') {
          const response = await fetch(`https://api.spotify.com/v1/playlists/${contextId}/tracks`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
          const data = await response.json();
          tracks = data.items.map((item: any) => item.track);
        } else if (contextType === 'artist') {
          const response = await fetch(`https://api.spotify.com/v1/artists/${contextId}/top-tracks?market=from_token`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
          const data = await response.json();
          tracks = data.tracks;
        }
        
        const tracksWithPreview = tracks.filter(track => track.preview_url);
        
        if (tracksWithPreview.length > 0) {
          set({
            currentTrack: tracksWithPreview[0],
            queue: tracksWithPreview.slice(1),
            playback: {
              ...get().playback,
              isPlaying: true,
              position: 0,
              duration: tracksWithPreview[0].duration_ms,
            },
            currentContext: { type: contextType, id: contextId }
          });
        } else {
          throw new Error('No hay pistas con vista previa disponible en este contexto');
        }
      }
    } catch (error) {
      console.error(`Error playing ${contextType}:`, error);
      set({ error: error instanceof Error ? error.message : `Failed to play ${contextType}` });
    } finally {
      set({ isLoading: false });
    }
  },
  
  playPause: async () => {
    const state = get();
    
    if (!state.currentTrack) return Promise.resolve();
    
    set({ isLoading: true, error: null });
    try {
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        if (!deviceId) {
          throw new Error('No hay dispositivo disponible para reproducción');
        }
        
        if (state.playback.isPlaying) {
          await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
        } else {
          await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
        }
      }
      else {
        set((state) => ({
          playback: {
            ...state.playback,
            isPlaying: !state.playback.isPlaying
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      set({ error: 'Failed to control playback' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  nextTrack: async () => {
    const state = get();
    set({ isLoading: true, error: null });
    
    try {
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        if (!deviceId) {
          throw new Error('No hay dispositivo disponible para reproducción');
        }
        
        await fetch('https://api.spotify.com/v1/me/player/next', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        });
      } 
      else {
        if (state.queue.length > 0) {
          const nextTrack = state.queue[0];
          const updatedQueue = state.queue.slice(1);
          
          set({
            currentTrack: nextTrack,
            queue: updatedQueue,
            playback: {
              ...state.playback,
              position: 0,
              duration: nextTrack.duration_ms,
            },
            history: [
              state.currentTrack!, 
              ...state.history.slice(0, 19)
            ].filter(Boolean)
          });
        }
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      set({ error: 'Failed to skip to next track' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  previousTrack: async () => {
    const state = get();
    set({ isLoading: true, error: null });
    
    try {
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        if (!deviceId) {
          throw new Error('No hay dispositivo disponible para reproducción');
        }
        
        await fetch('https://api.spotify.com/v1/me/player/previous', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        });
      } 
      else {
        if (state.history.length > 0) {
          const prevTrack = state.history[0];
          const updatedHistory = state.history.slice(1);
          
          set({
            currentTrack: prevTrack,
            queue: [
              state.currentTrack!,
              ...state.queue
            ].filter(Boolean),
            history: updatedHistory,
            playback: {
              ...state.playback,
              position: 0,
              duration: prevTrack.duration_ms,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      set({ error: 'Failed to skip to previous track' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  toggleShuffle: async () => {
    const state = get();
    set({ isLoading: true, error: null });
    
    try {
      const newShuffleState = !state.isShuffled;
      
      if (useAuthStore.getState().isPremium) {
        const deviceId = getDeviceId();
        if (!deviceId) {
          throw new Error('No hay dispositivo disponible para reproducción');
        }
        
        await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        });
      }
      
      set({ isShuffled: newShuffleState });
      
    } catch (error) {
      console.error('Error toggling shuffle mode:', error);
      set({ error: 'Failed to toggle shuffle mode' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  toggleRepeatMode: () => {
    const state = get();
    const modes: ['off', 'track', 'context'] = ['off', 'track', 'context'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    
    if (useAuthStore.getState().isPremium) {
      const deviceId = getDeviceId();
      if (deviceId) {
        fetch(`https://api.spotify.com/v1/me/player/repeat?state=${newMode}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        }).catch(error => {
          console.error('Error setting repeat mode:', error);
        });
      }
    }
    
    set({ repeatMode: newMode });
  },
  
  clearError: () => set({ error: null }),
  
  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),
}));