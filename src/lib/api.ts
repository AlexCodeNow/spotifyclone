import axios from 'axios';
import queryString from 'query-string';
import { useAuthStore } from '@/stores/auth-store';

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com/api';

const spotifyApi = axios.create({
  baseURL: SPOTIFY_API_BASE_URL,
});

const spotifyAuth = axios.create({
  baseURL: SPOTIFY_ACCOUNTS_URL,
});

spotifyApi.interceptors.request.use(
  async (config) => {
    const { accessToken, refreshToken, expiresAt } = useAuthStore.getState();
    
    if (!accessToken) {
      return Promise.reject(new Error('No access token available'));
    }
    
    if (expiresAt && Date.now() > expiresAt && refreshToken) {
      try {
        const newTokens = await refreshAccessToken(refreshToken);
        useAuthStore.getState().setTokens(
          newTokens.access_token,
          newTokens.refresh_token || refreshToken,
          newTokens.expires_in
        );
        config.headers.Authorization = `Bearer ${newTokens.access_token}`;
      } catch (error) {
        console.error('Error refreshing token:', error);
        useAuthStore.getState().clearAuth();
        return Promise.reject(new Error('Failed to refresh token'));
      }
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  return response.json();
}

export function initiateSpotifyAuth() {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Missing Spotify client ID or redirect URI');
  }
  
  const scopes = [
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
  ];
  
  const params = {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    response_type: 'code',
    show_dialog: true,
  };
  
  const authUrl = `https://accounts.spotify.com/authorize?${queryString.stringify(params)}`;
  window.location.href = authUrl;
}

export default spotifyApi;

export interface SpotifyPaginated<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export const spotifyApiHelpers = {
  getCurrentUserProfile: async () => {
    const response = await spotifyApi.get('/me');
    return response.data;
  },
  
  getUserPlaylists: async (limit = 20, offset = 0) => {
    const response = await spotifyApi.get<SpotifyPaginated<any>>('/me/playlists', {
      params: { limit, offset },
    });
    return response.data;
  },
  
  getSavedTracks: async (limit = 20, offset = 0) => {
    const response = await spotifyApi.get<SpotifyPaginated<any>>('/me/tracks', {
      params: { limit, offset },
    });
    return response.data;
  },

  getRecommendations: async (seedArtists?: string[], seedTracks?: string[], seedGenres?: string[], limit = 20) => {
    const params: any = { limit };
    
    if (seedArtists && seedArtists.length > 0) {
      params.seed_artists = seedArtists.join(',');
    }
    
    if (seedTracks && seedTracks.length > 0) {
      params.seed_tracks = seedTracks.join(',');
    }
    
    if (seedGenres && seedGenres.length > 0) {
      params.seed_genres = seedGenres.join(',');
    }
    
    const response = await spotifyApi.get('/recommendations', { params });
    return response.data;
  },
  
  search: async (query: string, types: string[] = ['track', 'artist', 'album', 'playlist'], limit = 20, offset = 0) => {
    const response = await spotifyApi.get('/search', {
      params: {
        q: query,
        type: types.join(','),
        limit,
        offset,
      },
    });
    return response.data;
  },
  
  createPlaylist: async (userId: string, name: string, description = '', isPublic = true, isCollaborative = false) => {
    const response = await spotifyApi.post(`/users/${userId}/playlists`, {
      name,
      description,
      public: isPublic,
      collaborative: isCollaborative
    });
    
    return response.data;
  },
  
  updatePlaylistDetails: async (playlistId: string, name: string, description = '', isPublic = true, isCollaborative = false) => {
    const response = await spotifyApi.put(`/playlists/${playlistId}`, {
      name,
      description,
      public: isPublic,
      collaborative: isCollaborative
    });
    
    return response.status === 200;
  },
  
  uploadPlaylistImage: async (playlistId: string, base64Image: string) => {
    const response = await fetch(`${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/images`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        'Content-Type': 'image/jpeg'
      },
      body: base64Image
    });
    
    return response.ok;
  },
  
  addTracksToPlaylist: async (playlistId: string, uris: string[]) => {
    const response = await spotifyApi.post(`/playlists/${playlistId}/tracks`, {
      uris
    });
    
    return response.data;
  },
  
  removeTracksFromPlaylist: async (playlistId: string, uris: string[]) => {
    const response = await spotifyApi.delete(`/playlists/${playlistId}/tracks`, {
      data: {
        tracks: uris.map(uri => ({ uri }))
      }
    });
    
    return response.data;
  },
  
  getPlaylistDetails: async (playlistId: string) => {
    const response = await spotifyApi.get(`/playlists/${playlistId}`);
    return response.data;
  }
};