import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  user: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (username: string, password: string) => {
        if (username && password) {
          set({ isLoggedIn: true, user: username });
          return true;
        }
        return false;
      },
      logout: () => set({ isLoggedIn: false, user: null }),
    }),
    { name: 'auth-storage' }
  )
);