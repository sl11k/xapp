import { getAuthToken } from './authToken';
import { getSupabase } from './supabase';
import { store } from './localStore';

/** Resolved user id for API layer: Supabase uid when cloud auth is on, else local session. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }
  const token = await getAuthToken();
  if (!token) return null;
  const session = await store.getSession(token);
  return session?.userId ?? null;
}
