'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import { usePlayerStore, Track } from '@/stores/player-store';
import { FaPlay, FaPause } from 'react-icons/fa';
import TrackList from '@/components/tracks/TrackList';
import MediaCard from '@/components/cards/MediaCard';
import Carousel from '@/components/layout/Carousel';

interface ArtistDetails {
  id: string;
  name: string;
  images: {
    url: string;
  }[];
  followers: {
    total: number;
  };
  genres: string[];
  popularity: number;
}

interface ArtistPageProps {
  params: {
    id: string | string[];
  };
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const { currentTrack, playback, playContext, setIsPlaying } = usePlayerStore();
  const { user } = useAuthStore() as { user: { id: string } | null };
  
  const getArtistId = () => {
    return params.id ? 
      (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') 
      : '';
  };
  
  const isThisPlaying = 
    usePlayerStore.getState().currentContext.type === 'artist' &&
    usePlayerStore.getState().currentContext.id === getArtistId() &&
    playback.isPlaying;
  
  const filterUniqueAlbums = (albums: any[]) => {
    const nameMap = new Map();
    return albums.filter((album) => {
      const name = album.name.toLowerCase();
      if (nameMap.has(name)) {
        const existing = nameMap.get(name);
        if (
          album.images.length > existing.images.length ||
          album.total_tracks > existing.total_tracks
        ) {
          nameMap.set(name, album);
          return true;
        }
        return false;
      } else {
        nameMap.set(name, album);
        return true;
      }
    });
  };
  
  useEffect(() => {
    const fetchArtistData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const artistId = getArtistId();
        
        if (!artistId) {
          throw new Error('Artist ID is missing or invalid');
        }
        
        const [
          artistResponse,
          topTracksResponse,
          albumsResponse,
          relatedArtistsResponse
        ] = await Promise.all([
          fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          
          fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=from_token`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          
          fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10&market=from_token`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          
          fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          })
        ]);
        
        if (!artistResponse.ok) {
          throw new Error('Failed to fetch artist data');
        }
        
        const artistData = await artistResponse.json();
        setArtist(artistData);
        
        if (topTracksResponse.ok) {
          const topTracksData = await topTracksResponse.json();
          setTopTracks(topTracksData.tracks);
        }
        
        if (albumsResponse.ok) {
          const albumsData = await albumsResponse.json();
          const uniqueAlbums = filterUniqueAlbums(albumsData.items);
          setAlbums(uniqueAlbums);
        }
        
        if (relatedArtistsResponse.ok) {
          const relatedArtistsData = await relatedArtistsResponse.json();
          setRelatedArtists(relatedArtistsData.artists);
        }
        
        if (user) {
          const checkFollowResponse = await fetch(
            `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
            {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            }
          );
          
          if (checkFollowResponse.ok) {
            const followData = await checkFollowResponse.json();
            setIsFollowing(followData[0] === true);
          }
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
        setError('Failed to load artist. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtistData();
  }, [params]);
  
  const togglePlayArtist = () => {
    const artistId = getArtistId();
    
    if (!artistId) {
      console.error('Artist ID is missing or invalid');
      return;
    }
    
    if (isThisPlaying) {
      setIsPlaying(false);
    } else {
      playContext('artist', artistId);
    }
  };
  
  const toggleFollowArtist = async () => {
    const artistId = getArtistId();
    
    if (!artistId) {
      console.error('Artist ID is missing or invalid');
      return;
    }
    
    try {
      const method = isFollowing ? 'DELETE' : 'PUT';
      const response = await fetch(
        `https://api.spotify.com/v1/me/following?type=artist&ids=${artistId}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
          }
        }
      );
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow artist:', error);
    }
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
  
  if (error || !artist) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Artist not found'}</p>
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
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-neutral-800 to-black opacity-60"></div>
        
        <div className="relative pt-16 pb-6 px-4 flex flex-col items-center text-center">
          <div className="w-48 h-48 rounded-full overflow-hidden mb-6 shadow-2xl">
            {artist.images && artist.images.length > 0 ? (
              <Image
                src={artist.images[0].url}
                alt={artist.name}
                width={192}
                height={192}
                className="object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 rounded-full">
                <span className="text-4xl text-neutral-400">🎤</span>
              </div>
            )}
          </div>
          
          <h1 className="text-5xl font-bold mb-2">{artist.name}</h1>
          
          <div className="text-sm text-gray-300 mb-4">
            {artist.followers && (
              <span className="font-medium">{formatFollowers(artist.followers.total)}</span>
            )} seguidores
          </div>
          
          {artist.genres && artist.genres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {artist.genres.slice(0, 3).map((genre, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-black bg-opacity-60 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={togglePlayArtist}
              className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              aria-label={isThisPlaying ? 'Pause' : 'Play'}
            >
              {isThisPlaying ? (
                <FaPause className="text-black text-xl" />
              ) : (
                <FaPlay className="text-black text-xl ml-1" />
              )}
            </button>
            
            <button
              onClick={toggleFollowArtist}
              className={`px-6 py-2 rounded-full border border-gray-500 font-medium hover:border-white ${
                isFollowing ? 'bg-green-500 border-green-500 text-black' : 'text-white'
              }`}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        {topTracks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Populares</h2>
            <TrackList
              tracks={topTracks.slice(0, 5)}
              showAlbum={true}
              showArtist={false}
              context={{ type: 'artist', id: getArtistId() }}
              showLikeButton={true}
            />
          </div>
        )}
        
        {albums.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Discografía</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.slice(0, 10).map((album) => (
                <MediaCard
                  key={album.id}
                  id={album.id}
                  type="album"
                  imageUrl={album.images[0]?.url || '/placeholder-album.png'}
                  title={album.name}
                  subtitle={`${album.release_date?.split('-')[0] || ''} • ${album.album_type}`}
                  href={`/album/${album.id}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {relatedArtists.length > 0 && (
          <div className="mb-12">
            <Carousel 
              title="Fans también escuchan"
              itemWidth={200} 
              gap={16}
            >
              {relatedArtists.map((artist) => (
                <div key={artist.id} style={{ width: '200px', flexShrink: 0 }}>
                  <MediaCard
                    id={artist.id}
                    type="artist"
                    imageUrl={artist.images[0]?.url || '/placeholder-artist.png'}
                    title={artist.name}
                    subtitle="Artista"
                    href={`/artist/${artist.id}`}
                  />
                </div>
              ))}
            </Carousel>
          </div>
        )}
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Sobre {artist.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-300">
                Información no disponible. Spotify no proporciona biografías de artistas a través de su API.
              </p>
            </div>
            <div>
              {artist.followers && (
                <div className="flex flex-col mb-6">
                  <span className="text-2xl font-bold">{formatFollowers(artist.followers.total)}</span>
                  <span className="text-gray-400">seguidores</span>
                </div>
              )}
              
              {artist.genres && artist.genres.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Géneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map((genre, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-neutral-800 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}