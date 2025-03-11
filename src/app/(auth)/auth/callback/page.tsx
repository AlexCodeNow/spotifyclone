'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { spotifyApiHelpers } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setUser, setIsLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      setIsLoading(true);
      
      try {
        const code = searchParams.get('code');
        
        if (code) {
          console.log('Código de autorización recibido. Procesando...');
          window.location.href = `/api/auth/callback?code=${code}`;
          return;
        }
        
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresIn = searchParams.get('expires_in');
        
        if (!accessToken || !refreshToken || !expiresIn) {
          console.error('Tokens faltantes:', { accessToken, refreshToken, expiresIn });
          throw new Error('Missing token information');
        }
        
        console.log('Tokens recibidos correctamente. Guardando...');
        
        setTokens(accessToken, refreshToken, parseInt(expiresIn, 10));
        
        const userProfile = await spotifyApiHelpers.getCurrentUserProfile();
        setUser(userProfile);
        
        router.push('/home');
      } catch (err) {
        console.error('Error durante auth callback:', err);
        setError('Failed to complete authentication');
        setTimeout(() => {
          router.push('/login?error=auth_failed');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [searchParams, setTokens, setUser, router, setIsLoading]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        {error ? (
          <div className="bg-red-500 text-white p-4 rounded-md">
            {error}
            <p className="mt-2 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">
              Completing authentication...
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}