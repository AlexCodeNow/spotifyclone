'use client';

import React from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (newVolume: number) => void;
  onMuteToggle: () => void;
}

export default function VolumeControl({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onMuteToggle 
}: VolumeControlProps) {
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    requestAnimationFrame(() => {
      onVolumeChange(newVolume);
    });
  };
  
  return (
    <div className="flex items-center">
      <button
        onClick={onMuteToggle}
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
        onChange={handleVolumeChange}
        className="w-24 h-1 appearance-none bg-gray-600 rounded-full outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, white ${volume * 100}%, #4b5563 ${volume * 100}%)`,
        }}
      />
    </div>
  );
}