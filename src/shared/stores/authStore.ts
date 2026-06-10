import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import { useProjectStore } from '@/shared/stores/projectStore';

interface AuthState {
  isLoggedIn: boolean;
  user: string | null;
  loading: boolean;
  offline: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  setOffline: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  user: null,
  loading: true,
  offline: !navigator.onLine,

  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ isLoggedIn: true, user: session.user.email ?? null, loading: false });
    } else {
      set({ isLoggedIn: false, user: null, loading: false });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ isLoggedIn: true, user: session.user.email ?? null });
      } else {
        set({ isLoggedIn: false, user: null });
      }
    });
  },

  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoggedIn: false, user: null });
      return false;
    }
    set({ isLoggedIn: true, user: email });
    return true;
  },

  register: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return false;
    }
    set({ isLoggedIn: true, user: email });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    useProjectStore.getState().clearAll();
    set({ isLoggedIn: false, user: null });
  },

  setOffline: (v) => set({ offline: v }),
}));
