'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Sidebar from '@/components/layout/SideBar';
import Player from '@/components/player/Player';
import TopBar from '@/components/layout/TopBar';
import { NotificationContainer } from '@/components/ui/Notification';
import { PlayerErrorObserver } from '@/components/player/PlayerErrorObserver';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken, isLoading } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading && !accessToken) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, accessToken]);
  
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPath={pathname} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-neutral-900 to-black">
            {children}
          </main>
        </div>
      </div>
      
      <Player />
      
      <NotificationContainer />
      
      <PlayerErrorObserver />
    </div>
  );
}