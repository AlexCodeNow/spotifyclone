'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { usePlayerStore, Track } from '@/stores/player-store';
import { FaPlay, FaPause, FaHeart, FaRegHeart } from 'react-icons/fa';
import TrackList from '@/components/tracks/TrackList';
import MediaCard from '@/components/cards/MediaCard';

interface AlbumDetails {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  images: {
    url: string;
  }[];
  release_date: string;
  total_tracks: number;
  tracks: {
    items: Track[];
  };
  type: 'album';
  genres: string[];
  label: string;
  popularity: number;
  copyrights: {
    text: string;
    type: string;
  }[];
}

export default function AlbumContent({ id }: { id: string }) {
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [moreByArtist, setMoreByArtist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  const { currentTrack, playback, playContext, setIsPlaying } = usePlayerStore();
  
  const isThisPlaying = 
    usePlayerStore.getState().currentContext.type === 'album' &&
    usePlayerStore.getState().currentContext.id === id &&
    playback.isPlaying;
  
  useEffect(() => {
    const fetchAlbumData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const albumId = id;
        
        if (!albumId) {
          throw new Error('Album ID is missing or invalid');
        }
        
        const [albumResponse, checkSavedResponse] = await Promise.all([
          fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          }),
          fetch(`https://api.spotify.com/v1/me/albums/contains?ids=${albumId}`, {
            headers: {
              'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
            }
          })
        ]);
        
        if (!albumResponse.ok) {
          throw new Error('Failed to fetch album data');
        }
        
        const albumData = await albumResponse.json();
        setAlbum(albumData);
        
        if (checkSavedResponse.ok) {
          const savedData = await checkSavedResponse.json();
          setIsSaved(savedData[0] === true);
        }
        
        if (albumData.artists && albumData.artists.length > 0) {
          const artistId = albumData.artists[0].id;
          const artistAlbumsResponse = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=6`,
            {
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
              }
            }
          );
          
          if (artistAlbumsResponse.ok) {
            const artistAlbumsData = await artistAlbumsResponse.json();
            const otherAlbums = artistAlbumsData.items.filter(
              (item: any) => item.id !== id
            );
            setMoreByArtist(otherAlbums);
          }
        }
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumData();
  }, [id]);
  
  const togglePlayAlbum = () => {
    const albumId = id;
    
    if (!albumId) {
      console.error('Album ID is missing or invalid');
      return;
    }
    
    if (isThisPlaying) {
      setIsPlaying(false);
    } else {
      playContext('album', albumId);
    }
  };
  
  const toggleSaveAlbum = async () => {
    const albumId = id;
    
    if (!albumId) {
      console.error('Album ID is missing or invalid');
      return;
    }
    
    try {
      const method = isSaved ? 'DELETE' : 'PUT';
      const response = await fetch(`https://api.spotify.com/v1/me/albums?ids=${albumId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error('Error toggling save album:', err);
    }
  };
  
  const formatReleaseDate = (dateString: string) => {
    if (!dateString) return '';
    
    if (dateString.length === 4) return dateString;
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error || !album) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Album not found'}</p>
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
      <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 shadow-lg">
          <Image
            src={album.images[0]?.url || '/placeholder-album.png'}
            alt={album.name}
            width={224}
            height={224}
            className="object-cover"
          />
        </div>
        
        <div className="flex flex-col text-center md:text-left">
          <span className="text-xs uppercase font-bold">{album.type}</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-1 mb-2">{album.name}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-300 mt-1">
            {album.artists.map((artist, index) => (
              <span key={artist.id}>
                <Link 
                  href={`/artist/${artist.id}`}
                  className="hover:underline font-medium"
                >
                  {artist.name}
                </Link>
                {index < album.artists.length - 1 && <span className="mx-1">•</span>}
              </span>
            ))}
            <span className="mx-1">•</span>
            <span>{album.release_date && formatReleaseDate(album.release_date)}</span>
            <span className="mx-1">•</span>
            <span>{album.total_tracks} canciones</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={togglePlayAlbum}
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
          onClick={toggleSaveAlbum}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={isSaved ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          {isSaved ? (
            <FaHeart className="text-green-500 text-2xl" />
          ) : (
            <FaRegHeart className="text-2xl" />
          )}
        </button>
      </div>
      
      {album.tracks && album.tracks.items.length > 0 && (
        <div className="mb-12">
          <TrackList
            tracks={album.tracks.items}
            showAlbum={false}
            showArtist={true}
            context={{ type: 'album', id: album.id }}
          />
        </div>
      )}
      
      <div className="mt-10 mb-12">
        <h2 className="text-xl font-bold mb-4">Información del álbum</h2>
        <div className="text-sm text-gray-400 space-y-2">
          {album.label && (
            <p>
              <span className="font-medium">Sello discográfico:</span> {album.label}
            </p>
          )}
          {album.genres && album.genres.length > 0 && (
            <p>
              <span className="font-medium">Géneros:</span> {album.genres.join(', ')}
            </p>
          )}
          {album.copyrights && album.copyrights.length > 0 && (
            <div className="mt-2">
              {album.copyrights.map((copyright, i) => (
                <p key={i} className="text-xs mt-1">
                  {copyright.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {moreByArtist.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Más de {album.artists[0].name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {moreByArtist.map((album) => (
              <MediaCard
                key={album.id}
                id={album.id}
                type="album"
                imageUrl={album.images[0]?.url || '/placeholder-album.png'}
                title={album.name}
                subtitle={album.artists.map((a: any) => a.name).join(', ')}
                href={`/album/${album.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}