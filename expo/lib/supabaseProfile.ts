import type { Profile } from './localStore';

export interface ProfileRow {
  user_id: string;
  name: string | null;
  role: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  industry: string | null;
  experience: string | null;
  skills: string[] | null;
  avatar_url: string | null;
}

export function profileRowToLocalProfile(row: ProfileRow | null, userId: string, signupName?: string): Profile {
  return {
    userId,
    name: row?.name ?? signupName ?? '',
    role: row?.role ?? '',
    company: row?.company ?? '',
    location: row?.location ?? '',
    bio: row?.bio ?? '',
    industry: row?.industry ?? '',
    experience: row?.experience ?? '',
    skills: row?.skills ?? [],
    avatarUrl: row?.avatar_url ?? null,
  };
}

export function localProfilePatchToSupabase(
  input: Partial<Omit<Profile, 'userId' | 'avatarUrl'>>,
): Record<string, string | string[] | null> {
  const row: Record<string, string | string[] | null> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.role !== undefined) row.role = input.role;
  if (input.company !== undefined) row.company = input.company;
  if (input.location !== undefined) row.location = input.location;
  if (input.bio !== undefined) row.bio = input.bio;
  if (input.industry !== undefined) row.industry = input.industry;
  if (input.experience !== undefined) row.experience = input.experience;
  if (input.skills !== undefined) row.skills = input.skills;
  return row;
}
