import { store } from './localStore';
import { getSupabase } from './supabase';
import { profileRowToLocalProfile, type ProfileRow } from './supabaseProfile';

async function fetchProfileAfterAuth(userId: string, nameFallback: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Remote auth not configured');
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: row, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (row) return profileRowToLocalProfile(row as ProfileRow, userId, nameFallback);
    await new Promise((r) => setTimeout(r, 200));
  }
  return profileRowToLocalProfile(null, userId, nameFallback);
}

export async function remoteRegister(input: { email: string; password: string; name: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Remote auth not configured');
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.user?.email) throw new Error('Signup failed');
  if (!data.session) {
    throw new Error(
      'Account created. Confirm your email if required, or turn off email confirmation in Supabase → Authentication.',
    );
  }
  const profile = await fetchProfileAfterAuth(data.user.id, name);
  await store.upsertUserAndProfile({ id: data.user.id, email: data.user.email }, profile);
  return { user: { id: data.user.id, email: data.user.email }, profile };
}

export async function remoteLogin(input: { email: string; password: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Remote auth not configured');
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error) throw new Error(error.message);
  if (!data.user?.email) throw new Error('Login failed');
  const metaName = typeof data.user.user_metadata?.name === 'string' ? data.user.user_metadata.name : '';
  const profile = await fetchProfileAfterAuth(data.user.id, metaName);
  await store.upsertUserAndProfile({ id: data.user.id, email: data.user.email }, profile);
  return { user: { id: data.user.id, email: data.user.email }, profile };
}

export async function remoteSignOut() {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}
