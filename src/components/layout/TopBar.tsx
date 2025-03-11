'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import Image from 'next/image';

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        setScrolled(mainContent.scrollTop > 40);
      }
    };
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => {
        mainContent.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleForward = () => {
    router.forward();
  };
  
  const isSearchPage = pathname === '/search';
  
  return (
    <div 
      className={`sticky top-0 px-6 py-4 flex items-center justify-between z-10 transition-colors duration-300 ${
        scrolled ? 'bg-black bg-opacity-90' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center">
        <button 
          onClick={handleBack}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-black bg-opacity-70 text-white mr-2"
          aria-label="Go back"
        >
          <FaChevronLeft />
        </button>
        
        <button 
          onClick={handleForward}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-black bg-opacity-70 text-white mr-4"
          aria-label="Go forward"
        >
          <FaChevronRight />
        </button>
        
      </div>
      
      {user && (
        <div className="relative group">
          <button
            className="flex items-center bg-black bg-opacity-70 rounded-full p-0.5 pr-2 hover:bg-opacity-50"
          >
            <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-700 mr-2">
              {user.images && user.images.length > 0 ? (
                <Image 
                  src={user.images[0].url} 
                  alt={user.display_name} 
                  width={28} 
                  height={28} 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-700 text-white">
                  <FaUser size={14} />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white mr-1">
              {user.display_name}
            </span>
          </button>
          
          <div className="absolute right-0 mt-1 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
            <a href="/profile" className="block px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700">
              Profile
            </a>
            <a href="/settings" className="block px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700">
              Settings
            </a>
            <button 
              onClick={() => useAuthStore.getState().clearAuth()}
              className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-neutral-700"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}