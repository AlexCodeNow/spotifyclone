'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  FaPlay, 
  FaPause, 
  FaStepBackward, 
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaRandom,
  FaRedoAlt
} from 'react-icons/fa';
import { useAuthStore } from '@/stores/auth-store';
import { create } from 'zustand';
import { saveDeviceId, activateDevice, getDeviceId } from '@/lib/device-helper';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
  uri?: string;
}

interface PlayerState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'track' | 'context';
  
  setCurrentTrack: (track: SpotifyTrack | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  position: 0,
  duration: 0,
  isShuffled: false,
  repeatMode: 'off',
  
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  toggleRepeatMode: () => set((state) => ({ 
    repeatMode: state.repeatMode === 'off' 
      ? 'track' 
      : state.repeatMode === 'track' 
        ? 'context' 
        : 'off' 
  })),
}));

export default function Player() {
  const { currentTrack, isPlaying, volume, position, duration, isShuffled, repeatMode, setIsPlaying, setPosition, setVolume, setDuration, toggleShuffle, toggleRepeatMode } = usePlayerStore();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const { isPremium, accessToken } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isVolumeChangingRef = useRef(false);
  
  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      if (audioRef.current) {
        audioRef.current.volume = prevVolume;
      }
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const wasPlaying = isPlaying;
    
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    if (isPremium && accessToken) {
      const deviceId = getDeviceId();
      if (deviceId) {
        fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(newVolume * 100)}&device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }).catch(err => {
          console.error('Error al ajustar volumen en Spotify API:', err);
        });
      }
    }
    
    if (wasPlaying && audioRef.current && audioRef.current.paused) {
      setTimeout(() => {
        try {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.error('Error al reanudar la reproducción después de cambiar el volumen:', err);
              });
            }
          }
        } catch (err) {
          console.error('Error general al intentar reanudar la reproducción:', err);
        }
      }, 50);
    }
  };
  
  useEffect(() => {
    if (!isPremium) return;
    
    let spotifyPlayer: any = null;
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    
    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return;
      
      spotifyPlayer = new window.Spotify.Player({
        name: 'Spotify Clone Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(token); },
        volume: volume
      });
      
      const errorTypes = ['initialization_error', 'authentication_error', 'account_error', 'playback_error'];
      errorTypes.forEach(type => {
        spotifyPlayer.addListener(type, ({ message }: { message: string }) => {
          console.error(`${type}:`, message);
          import('@/components/ui/Notification').then(module => {
            const { useNotificationStore } = module;
            useNotificationStore.getState().showNotification(
              'error',
              `Error: ${message}`,
              5000
            );
          });
        });
      });
      
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state?.track_window?.current_track) return;
        
        const currentTrack = state.track_window.current_track;
        usePlayerStore.getState().setCurrentTrack({
          id: currentTrack.id,
          name: currentTrack.name,
          artists: currentTrack.artists,
          album: currentTrack.album,
          duration_ms: currentTrack.duration_ms,
          preview_url: null,
          uri: currentTrack.uri
        });
        
        usePlayerStore.getState().setIsPlaying(!state.paused);
        usePlayerStore.getState().setPosition(state.position);
        usePlayerStore.getState().setDuration(currentTrack.duration_ms);
      });
      
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        saveDeviceId(device_id);
        
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
          activateDevice(device_id, accessToken);
        }
      });
      
      spotifyPlayer.connect().then((success: boolean) => {
        if (success) {
          console.log('El reproductor de Spotify se ha conectado correctamente');
        } else {
          console.error('Error al conectar el reproductor de Spotify');
        }
      });
    };
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      window.onSpotifyWebPlaybackSDKReady = null;
      
      if (spotifyPlayer) {
        spotifyPlayer.disconnect();
      }
    };
  }, [isPremium]);
  
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.preview_url) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error reproduciendo audio:', error);
          setIsPlaying(false);
          
          import('@/components/ui/Notification').then(module => {
            const { useNotificationStore } = module;
            useNotificationStore.getState().showNotification(
              'error',
              'No se pudo reproducir la pista.',
              5000
            );
          });
        });
      }
    } else {
      audioRef.current.pause();
    }
    
    const onPlay = () => {
      if (!isPlaying) setIsPlaying(true);
    };
    
    const onPause = () => {
      if (isPlaying && !isVolumeChangingRef.current) setIsPlaying(false);
    };
    
    const onEnded = () => setIsPlaying(false);
    
    audioRef.current.addEventListener('play', onPlay);
    audioRef.current.addEventListener('pause', onPause);
    audioRef.current.addEventListener('ended', onEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', onPlay);
        audioRef.current.removeEventListener('pause', onPause);
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [isPlaying, currentTrack, setIsPlaying]);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const updatePosition = () => {
      if (audioRef.current) {
        setPosition(audioRef.current.currentTime * 1000);
      } else if (isPremium && accessToken) {
        fetch('https://api.spotify.com/v1/me/player', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => response.ok ? response.text() : null)
        .then(text => {
          if (text && text.trim() !== '') {
            const data = JSON.parse(text);
            if (data?.progress_ms !== undefined) {
              setPosition(data.progress_ms);
            }
          }
        })
        .catch(error => console.error('Error updating position:', error));
      }
    };
    
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPremium, accessToken, setPosition]);
  
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value, 10);
    setPosition(newPosition);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newPosition / 1000;
      return;
    }
    
    if (isPremium && accessToken) {
      const deviceId = getDeviceId();
      if (deviceId) {
        fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}&device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).catch(error => console.error('Error seeking position:', error));
      }
    }
  };
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  if (!currentTrack) {
    return (
      <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center px-4">
        <div className="w-full flex justify-between items-center">
          <div className="w-1/3"></div>
          <div className="w-1/3 flex justify-center">
            <div className="text-gray-400 text-sm">No track playing</div>
          </div>
          <div className="w-1/3"></div>
        </div>
      </div>
    );
  }
  
  const togglePlay = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (audioRef.current) {
      if (newPlayingState) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Error al reproducir audio:", err);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    } else if (isPremium && accessToken) {
      const deviceId = getDeviceId();
      if (deviceId) {
        const endpoint = newPlayingState 
          ? 'https://api.spotify.com/v1/me/player/play' 
          : 'https://api.spotify.com/v1/me/player/pause';
          
        fetch(`${endpoint}?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => {
          if (!response.ok) {
            setIsPlaying(!newPlayingState);
          }
        })
        .catch(() => setIsPlaying(!newPlayingState));
      }
    }
  };
  
  const changeTrack = (direction: 'next' | 'previous') => {
    try {
      import('@/stores/player-store').then(module => {
        const method = direction === 'next' ? 'nextTrack' : 'previousTrack';
        module.usePlayerStore.getState()[method]();
      });
    } catch (error) {
      console.error(`Error navigating to ${direction} track:`, error);
    }
  };
  
  return (
    <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center px-4">
      {currentTrack.preview_url && (
        <audio
          ref={audioRef}
          src={currentTrack.preview_url}
          onDurationChange={(e) => setDuration(e.currentTarget.duration * 1000)}
        />
      )}
      
      <div className="w-full flex justify-between items-center">
        <div className="w-1/3 flex items-center">
          <div className="h-14 w-14 mr-3 relative">
            {currentTrack.album.images.length > 0 && (
              <Image
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                layout="fill"
                objectFit="cover"
              />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white truncate max-w-xs">
              {currentTrack.name}
            </h4>
            <p className="text-xs text-gray-400 truncate max-w-xs">
              {currentTrack.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>
        
        <div className="w-1/3 flex flex-col items-center">
          <div className="flex items-center mb-2">
            <button
              onClick={toggleShuffle}
              className={`mx-2 focus:outline-none ${isShuffled ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
              aria-label="Shuffle"
            >
              <FaRandom size={14} />
            </button>
            
            <button
              onClick={() => changeTrack('previous')}
              className="mx-2 text-gray-400 hover:text-white focus:outline-none"
              aria-label="Previous track"
            >
              <FaStepBackward size={14} />
            </button>
            
            <button
              onClick={togglePlay}
              className="mx-3 h-8 w-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <FaPause className="text-black" size={14} />
              ) : (
                <FaPlay className="text-black ml-1" size={14} />
              )}
            </button>
            
            <button
              onClick={() => changeTrack('next')}
              className="mx-2 text-gray-400 hover:text-white focus:outline-none"
              aria-label="Next track"
            >
              <FaStepForward size={14} />
            </button>
            
            <button
              onClick={toggleRepeatMode}
              className={`mx-2 focus:outline-none ${repeatMode !== 'off' ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
              aria-label={`Repeat: ${repeatMode}`}
            >
              <FaRedoAlt size={14} />
            </button>
          </div>
          
          <div className="w-full flex items-center">
            <span className="text-xs text-gray-400 mr-2 w-10 text-right">
              {formatTime(position)}
            </span>
            <input
              type="range"
              value={position}
              min={0}
              max={duration}
              onChange={handlePositionChange}
              className="w-full h-1 appearance-none bg-gray-600 rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${(position / duration) * 100}%, #4b5563 ${(position / duration) * 100}%)`,
              }}
            />
            <span className="text-xs text-gray-400 ml-2 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        <div className="w-1/3 flex justify-end items-center">
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white mr-2 focus:outline-none"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <FaVolumeMute size={18} />
            ) : (
              <FaVolumeUp size={18} />
            )}
          </button>
          <input
            type="range"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            onMouseDown={() => { isVolumeChangingRef.current = true; }}
            onMouseUp={() => { 
              isVolumeChangingRef.current = false;
              if (isPlaying && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(err => console.error('Error al reanudar:', err));
              }
            }}
            className="w-24 h-1 appearance-none bg-gray-600 rounded-full outline-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, white ${volume * 100}%, #4b5563 ${volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Agregar la definición para Spotify global
declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: any;
  }
}