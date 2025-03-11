'use client';

import { useSearchParams } from 'next/navigation';
import { initiateSpotifyAuth } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const handleLogin = () => {
    initiateSpotifyAuth();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image 
            src="/spotify-logo.png" 
            alt="Spotify" 
            width={196} 
            height={60} 
            className="mb-8" 
          />
          <h1 className="text-3xl font-bold text-white mb-12 text-center">
            Log in to Spotify
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-6">
            {error === 'missing_code' && 'Authorization code is missing'}
            {error === 'auth_failed' && 'Authentication failed'}
            {!['missing_code', 'auth_failed'].includes(error) && 'An error occurred during login'}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition duration-200"
        >
          Log in with Spotify
        </button>
        
        <p className="text-gray-400 text-sm text-center mt-8">
          Don&apos;t have a Spotify account?{' '}
          <a
            href="https://www.spotify.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            Sign up for Spotify
          </a>
        </p>
      </div>
    </div>
  );
}