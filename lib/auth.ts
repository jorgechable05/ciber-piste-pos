import { createSupabaseBrowser } from './supabase-browser';

export async function getCurrentUser() {
  const { data, error } = await createSupabaseBrowser().auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signOut() {
  await createSupabaseBrowser().auth.signOut();
  window.location.href = '/login';
}
