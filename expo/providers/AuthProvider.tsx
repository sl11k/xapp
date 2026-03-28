import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { remoteLogin, remoteRegister } from '@/lib/remoteAuth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { trpcClient, getAuthToken, setAuthToken } from '@/lib/trpc';

export interface UserProfile {
  userId: string;
  name: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  industry: string;
  experience: string;
  skills: string[];
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
}

type AuthState = 'loading' | 'authenticated' | 'guest';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      console.log('[Auth] restoring session...');
      try {
        if (isSupabaseConfigured()) {
          const supabase = getSupabase();
          const { data: { session } } = await supabase!.auth.getSession();
          if (!session) {
            console.log('[Auth] no Supabase session, guest mode');
            setAuthState('guest');
            return;
          }
        } else {
          const stored = await getAuthToken();
          if (!stored) {
            console.log('[Auth] no stored token, guest mode');
            setAuthState('guest');
            return;
          }
        }
        const result = await trpcClient.auth.me.query();
        setUser(result.user);
        setProfile(result.profile as UserProfile | null);
        setAuthState('authenticated');
        console.log('[Auth] session restored for', result.user.email);
      } catch (err) {
        console.log('[Auth] session restore failed, clearing token', err);
        await setAuthToken(null);
        if (isSupabaseConfigured()) await getSupabase()?.auth.signOut();
        setAuthState('guest');
      }
    };
    void restoreSession();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      console.log('[Auth] login mutation', input.email);
      if (isSupabaseConfigured()) return remoteLogin(input);
      return trpcClient.auth.login.mutate(input);
    },
    onSuccess: async (data) => {
      if (!isSupabaseConfigured()) await setAuthToken(data.token);
      else await setAuthToken(null);
      setUser(data.user);
      setProfile(data.profile as UserProfile | null);
      setAuthState('authenticated');
      console.log('[Auth] login success', data.user.email);
    },
    onError: (err) => {
      console.log('[Auth] login error', err.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: { email: string; password: string; name: string }) => {
      console.log('[Auth] register mutation', input.email);
      if (isSupabaseConfigured()) return remoteRegister(input);
      return trpcClient.auth.register.mutate(input);
    },
    onSuccess: async (data) => {
      if (!isSupabaseConfigured()) await setAuthToken(data.token);
      else await setAuthToken(null);
      setUser(data.user);
      setProfile((data.profile ?? null) as UserProfile | null);
      setAuthState('authenticated');
      console.log('[Auth] register success', data.user.email);
    },
    onError: (err) => {
      console.log('[Auth] register error', err.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] logout mutation');
      try {
        await trpcClient.auth.logout.mutate();
      } catch (err) {
        console.log('[Auth] logout server call failed, clearing locally', err);
      }
    },
    onSettled: async () => {
      await setAuthToken(null);
      setUser(null);
      setProfile(null);
      setAuthState('guest');
      queryClient.clear();
      console.log('[Auth] logged out, cleared state');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (input: Partial<Omit<UserProfile, 'userId' | 'avatarUrl'>>) => {
      console.log('[Auth] updateProfile mutation', input);
      return trpcClient.auth.updateProfile.mutate(input);
    },
    onSuccess: (data) => {
      setProfile(data as UserProfile);
      console.log('[Auth] profile updated');
    },
    onError: (err) => {
      console.log('[Auth] updateProfile error', err.message);
    },
  });

  const enterGuest = useCallback(() => {
    console.log('[Auth] entering guest mode');
    setAuthState('guest');
  }, []);

  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';
  const isGuest = authState === 'guest' && !user;

  return useMemo(
    () => ({
      authState,
      user,
      profile,
      isAuthenticated,
      isLoading,
      isGuest,
      login: loginMutation.mutateAsync,
      loginError: loginMutation.error?.message ?? null,
      isLoggingIn: loginMutation.isPending,
      register: registerMutation.mutateAsync,
      registerError: registerMutation.error?.message ?? null,
      isRegistering: registerMutation.isPending,
      logout: logoutMutation.mutate,
      isLoggingOut: logoutMutation.isPending,
      updateProfile: updateProfileMutation.mutateAsync,
      isUpdatingProfile: updateProfileMutation.isPending,
      updateProfileError: updateProfileMutation.error?.message ?? null,
      enterGuest,
    }),
    [
      authState,
      user,
      profile,
      isAuthenticated,
      isLoading,
      isGuest,
      loginMutation,
      registerMutation,
      logoutMutation,
      updateProfileMutation,
      enterGuest,
    ],
  );
});
