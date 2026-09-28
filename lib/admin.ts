import { createSupabaseBrowser } from './supabase-browser';

export type ManageableRole = { id: number; nombre: string; descripcion: string | null; activo: boolean };
export type ManageableProfile = { id: string; nombre: string; telefono: string | null; rol_id: number; rol: string; activo: boolean; created_at: string };

export async function getManageableRoles() {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc('manageable_roles');
  if (error) throw error;
  return (data ?? []) as ManageableRole[];
}

export async function getManageableProfiles() {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc('manageable_profiles');
  if (error) throw error;
  return (data ?? []) as ManageableProfile[];
}

export async function assignUserRole(userId: string, roleId: number) {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.rpc('assign_user_role', { p_user_id: userId, p_role_id: roleId });
  if (error) throw error;
}

export async function setUserActive(userId: string, active: boolean) {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.rpc('set_user_active', { p_user_id: userId, p_active: active });
  if (error) throw error;
}
