import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isPremium: false,
      
      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({ 
          accessToken, 
          refreshToken, 
          expiresAt,
          isAuthenticated: true 
        });
      },
      
      setUser: (user) => {
        set({ 
          user,
          isPremium: user.product === 'premium'
        });
      },
      
      clearAuth: () => {
        set({ 
          accessToken: null, 
          refreshToken: null, 
          expiresAt: null, 
          user: null,
          isAuthenticated: false,
          isPremium: false
        });
      },
      
      setIsLoading: (isLoading) => {
        set({ isLoading });
      },
      
      checkAuth: () => {
        const state = get();
        
        if (!state.accessToken) {
          return false;
        }
        
        if (state.expiresAt && Date.now() > state.expiresAt && !state.refreshToken) {
          get().clearAuth();
          return false;
        }
        
        return true;
      }
    }),
    {
      name: 'spotify-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);