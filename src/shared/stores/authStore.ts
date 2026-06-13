import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import { useProjectStore } from '@/shared/stores/projectStore';

type LoginResult = 'success' | 'not_found' | 'failed';

async function fetchUsername(userId: string, fallbackEmail?: string | null): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();
  return data?.username ?? fallbackEmail ?? null;
}

interface AuthState {
  isLoggedIn: boolean;
  user: string | null;
  loading: boolean;
  offline: boolean;
  login: (emailOrUsername: string, password: string) => Promise<LoginResult>;
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
      const username = await fetchUsername(session.user.id, session.user.email);
      set({ isLoggedIn: true, user: username, loading: false });
    } else {
      set({ isLoggedIn: false, user: null, loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const username = await fetchUsername(session.user.id, session.user.email);
        set({ isLoggedIn: true, user: username });
      } else {
        set({ isLoggedIn: false, user: null });
      }
    });
  },

  login: async (input: string, password: string): Promise<LoginResult> => {
    let email = input;
    let username: string | null = null;
    if (!input.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('email, username')
        .eq('username', input)
        .maybeSingle();
      if (!data) return 'not_found';
      email = data.email;
      username = data.username;
    }
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoggedIn: false, user: null });
      return 'failed';
    }
    if (!username && signInData.user) {
      username = await fetchUsername(signInData.user.id, email);
    }
    set({ isLoggedIn: true, user: username ?? email });
    return 'success';
  },

  register: async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('[register] signUp failed:', error);
      return false;
    }
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username, email });
      if (profileError) {
        // 可能 RLS 阻挡了，尝试用 RPC 写入
        console.warn('[register] direct insert failed, trying RPC:', profileError);
        const { error: rpcError } = await supabase
          .rpc('create_my_profile', { _uid: data.user.id, _username: username, _email: email });
        if (rpcError) {
          console.error('[register] RPC insert also failed:', rpcError);
          return false;
        }
      }
    }
    set({ isLoggedIn: true, user: username });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    useProjectStore.getState().clearAll();
    set({ isLoggedIn: false, user: null });
  },

  setOffline: (v) => set({ offline: v }),
}));
