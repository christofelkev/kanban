import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';

class AuthState {
  user = $state<User | null>(null);
  session = $state<Session | null>(null);
  loading = $state<boolean>(true);
  initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const { data } = await supabase.auth.getSession();
      this.session = data.session;
      this.user = data.session?.user ?? null;
    } catch (err) {
      console.error('Error fetching auth session:', err);
    } finally {
      this.loading = false;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
    });
  }

  async signInWithEmail(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data.session) {
      this.session = res.data.session;
      this.user = res.data.session.user;
    }
    return res;
  }

  async signUpWithEmail(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password
    });
  }

  async signInWithGoogle() {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });
  }

  async signOut() {
    const res = await supabase.auth.signOut();
    this.session = null;
    this.user = null;
    return res;
  }

  async resetPassword(email: string) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined;
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
  }
}

export const auth = new AuthState();
