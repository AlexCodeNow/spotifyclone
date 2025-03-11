'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import Carousel from '@/components/layout/Carousel';
import MediaCard from '@/components/cards/MediaCard';
import { Track } from '@/stores/player-store';

interface SpotifyItem {
  id: string;
  name: string;
  type: 'album' | 'playlist' | 'artist' | 'track';
  images: { url: string }[];
  artists?: { id: string; name: string }[];
  album?: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  description?: string;
  preview_url?: string;
  uri?: string;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const [recentlyPlayed, setRecentlyPlayed] = useState<SpotifyItem[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyItem[]>([]);
  const [newReleases, setNewReleases] = useState<SpotifyItem[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [categoryPlaylists, setCategoryPlaylists] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [
          recentlyPlayedResponse,
          featuredPlaylistsResponse,
          newReleasesResponse
        ] = await Promise.all([
          fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          
          fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=10', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          
          fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          })
        ]);

        if (recentlyPlayedResponse.ok) {
          const data = await recentlyPlayedResponse.json();
          const uniqueTracks = Array.from(
            new Map(
              data.items.map((item: any) => [item.track.id, {
                ...item.track,
                type: 'track'
              }])
            ).values()
          ) as SpotifyItem[];
          setRecentlyPlayed(uniqueTracks);
        }
        
        if (featuredPlaylistsResponse.ok) {
          const data = await featuredPlaylistsResponse.json();
          setFeaturedPlaylists(data.playlists.items);
        }
        
        if (newReleasesResponse.ok) {
          const data = await newReleasesResponse.json();
          setNewReleases(data.albums.items);
        }
        
        try {
          const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
          
          if (topArtistsResponse.ok) {
            const topArtistsData = await topArtistsResponse.json();
            setTopArtists(topArtistsData.items || []);
            
            if (topArtistsData.items && topArtistsData.items.length > 0) {
              const artistIds = topArtistsData.items
                .slice(0, 3)
                .map((artist: any) => artist.id)
                .join(',');
                
              const recommendationsResponse = await fetch(
                `https://api.spotify.com/v1/recommendations?seed_artists=${artistIds}&limit=10`,
                {
                  headers: {
                    'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                  }
                }
              );
              
              if (recommendationsResponse.ok) {
                const recommendationsData = await recommendationsResponse.json();
                setRecommendations(recommendationsData.tracks);
              }
            }
          }
        } catch (error) {
          console.error("Error obteniendo artistas top:", error);
          try {
            const recommendationsResponse = await fetch(
              `https://api.spotify.com/v1/recommendations?seed_genres=pop,rock,hiphop&limit=10`,
              {
                headers: {
                  'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                }
              }
            );
            
            if (recommendationsResponse.ok) {
              const recommendationsData = await recommendationsResponse.json();
              setRecommendations(recommendationsData.tracks);
            }
          } catch (recError) {
            console.error("Error obteniendo recomendaciones:", recError);
          }
        }
        
        try {
          const categoriesResponse = await fetch('https://api.spotify.com/v1/browse/categories?limit=5', {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          });
          
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            
            if (categoriesData.categories && categoriesData.categories.items.length > 0) {
              const firstCategory = categoriesData.categories.items[0];
              
              const categoryPlaylistsResponse = await fetch(
                `https://api.spotify.com/v1/browse/categories/${firstCategory.id}/playlists?limit=10`,
                {
                  headers: {
                    'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                  }
                }
              );
              
              if (categoryPlaylistsResponse.ok) {
                const playlistsData = await categoryPlaylistsResponse.json();
                setCategoryPlaylists(playlistsData.playlists?.items || []);
              }
            }
          }
        } catch (error) {
          console.error("Error obteniendo playlists de categoría:", error);
        }
        
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Error loading content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
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
      <h1 className="text-3xl font-bold mb-6">{getGreeting()}</h1>
      
      {recentlyPlayed.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map((track) => (
              <MediaCard
                key={track.id}
                id={track.id}
                type="track"
                imageUrl={track.album?.images[0]?.url || '/placeholder-album.png'}
                title={track.name}
                subtitle={track.artists?.map(a => a.name).join(', ')}
                href={`/track/${track.id}`}
                data={track}
              />
            ))}
          </div>
        </div>
      )}
      
      {topArtists.length > 0 && (
        <Carousel
          title="Tus artistas favoritos"
          subtitle="Los artistas que más escuchas"
          viewAllHref="/top-artists"
        >
          {topArtists.map((artist) => (
            <div key={artist.id} style={{ width: '200px', flexShrink: 0 }}>
              <MediaCard
                id={artist.id}
                type="artist"
                imageUrl={artist.images?.[0]?.url || '/placeholder-artist.png'}
                title={artist.name}
                subtitle="Artista"
                href={`/artist/${artist.id}`}
              />
            </div>
          ))}
        </Carousel>
      )}
      
      {recommendations.length > 0 && (
        <Carousel
          title="Recomendado para ti"
          subtitle="Basado en lo que escuchas"
          viewAllHref="/recommendations"
        >
          {recommendations.map((track) => (
            <div key={track.id} style={{ width: '200px', flexShrink: 0 }}>
              <MediaCard
                id={track.id}
                type="track"
                imageUrl={track.album.images[0].url}
                title={track.name}
                subtitle={track.artists.map(a => a.name).join(', ')}
                data={track}
              />
            </div>
          ))}
        </Carousel>
      )}
      
      {categoryPlaylists.length > 0 && (
        <Carousel
          title="Las mejores playlists"
          subtitle="Seleccionadas para ti"
          viewAllHref="/genre-playlists"
        >
          {categoryPlaylists.map((playlist) => (
            <div key={playlist.id} style={{ width: '200px', flexShrink: 0 }}>
              <MediaCard
                id={playlist.id}
                type="playlist"
                imageUrl={playlist.images?.[0]?.url || '/placeholder-playlist.png'}
                title={playlist.name}
                subtitle={playlist.description || 'Playlist de Spotify'}
                href={`/playlist/${playlist.id}`}
              />
            </div>
          ))}
        </Carousel>
      )}
      
      {featuredPlaylists.length > 0 && (
        <Carousel
          title="Playlists destacadas"
          viewAllHref="/featured-playlists"
        >
          {featuredPlaylists.map((playlist) => (
            <div key={playlist.id} style={{ width: '200px', flexShrink: 0 }}>
              <MediaCard
                id={playlist.id}
                type="playlist"
                imageUrl={playlist.images[0].url}
                title={playlist.name}
                subtitle={playlist.description || 'Playlist de Spotify'}
                href={`/playlist/${playlist.id}`}
              />
            </div>
          ))}
        </Carousel>
      )}
      
      {newReleases.length > 0 && (
        <Carousel
          title="Lanzamientos recientes"
          viewAllHref="/new-releases"
        >
          {newReleases.map((album) => (
            <div key={album.id} style={{ width: '200px', flexShrink: 0 }}>
              <MediaCard
                id={album.id}
                type="album"
                imageUrl={album.images[0].url}
                title={album.name}
                subtitle={album.artists?.map(a => a.name).join(', ')}
                href={`/album/${album.id}`}
              />
            </div>
          ))}
        </Carousel>
      )}
    </div>
  );
}