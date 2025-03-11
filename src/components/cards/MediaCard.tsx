'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaPause } from 'react-icons/fa';
import { usePlayerStore } from '@/stores/player-store';

interface MediaCardProps {
  id: string;
  type: 'album' | 'playlist' | 'artist' | 'track';
  imageUrl: string;
  title: string;
  subtitle?: string;
  href?: string;
  data?: any;
}

export default function MediaCard({
  id,
  type,
  imageUrl,
  title,
  subtitle,
  href,
  data
}: MediaCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { currentTrack, playback, playTrack, playContext } = usePlayerStore();
  
  const isThisPlaying = 
    (type === 'track' && currentTrack?.id === id && playback.isPlaying) ||
    (type !== 'track' && usePlayerStore.getState().currentContext.type === type && 
     usePlayerStore.getState().currentContext.id === id && playback.isPlaying);
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (type === 'track' && data) {
      playTrack(data);
    } else if (type === 'album' || type === 'playlist' || type === 'artist') {
      playContext(type, id);
    }
  };
  
  const itemHref = href || `/${type}/${id}`;
  
  const getShape = () => {
    if (type === 'artist') {
      return 'rounded-full';
    }
    return 'rounded-md';
  };
  
  return (
    <div 
      className="p-4 bg-neutral-800 bg-opacity-40 rounded-lg transition-all duration-200 hover:bg-neutral-700 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={itemHref} className="block relative">
        <div className="relative aspect-square w-full mb-4 overflow-hidden shadow-lg">
          <Image
            src={imageUrl || '/placeholder-image.png'}
            alt={title}
            fill
            className={`object-cover ${getShape()}`}
          />
          
          {isHovering && (
            <button
              onClick={handlePlay}
              className={`absolute bottom-2 right-2 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg transform transition-transform ${
                isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } group-hover:opacity-100 group-hover:translate-y-0`}
              aria-label={isThisPlaying ? 'Pause' : 'Play'}
            >
              {isThisPlaying ? (
                <FaPause className="text-black" />
              ) : (
                <FaPlay className="text-black ml-1" />
              )}
            </button>
          )}
        </div>
        
        <h3 className="font-bold truncate">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 truncate mt-1">{subtitle}</p>
        )}
      </Link>
    </div>
  );
}