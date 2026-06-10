import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import { useProjectStore } from '@/shared/stores/projectStore';

interface AuthState {
  isLoggedIn: boolean;
  user: string | null;
  loading: boolean;
  offline: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
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

  login: async (input: string, password: string) => {
    let email = input;
    if (!input.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', input)
        .maybeSingle();
      if (!data) return false;
      email = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoggedIn: false, user: null });
      return false;
    }
    set({ isLoggedIn: true, user: email });
    return true;
  },

  register: async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return false;
    }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
      }).maybeSingle();
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
