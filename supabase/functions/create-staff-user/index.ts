import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('UNAUTHORIZED');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error('UNAUTHORIZED');
    const admin = createClient(url, service);
    const { data: callerProfile, error: profileError } = await admin.from('profiles').select('rol_id,roles(nombre)').eq('id', caller.id).single();
    if (profileError || !callerProfile) throw new Error('PROFILE_NOT_FOUND');
    const callerRole = String((callerProfile.roles as { nombre?: string } | null)?.nombre ?? '');
    if (!['DUEÑO', 'ENCARGADO', 'ADMINISTRADOR'].includes(callerRole)) throw new Error('PERMISSION_DENIED');

    const body = await req.json() as { email?: string; password?: string; nombre?: string; telefono?: string; rol_id?: number };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const nombre = body.nombre?.trim();
    const rolId = Number(body.rol_id);
    if (!email || !password || password.length < 8 || !nombre || !Number.isInteger(rolId)) throw new Error('INVALID_INPUT');

    const { data: targetRole } = await admin.from('roles').select('id,nombre').eq('id', rolId).eq('activo', true).single();
    if (!targetRole) throw new Error('ROLE_NOT_FOUND');
    if (callerRole !== 'DUEÑO' && ['DUEÑO', 'ADMINISTRADOR'].includes(String(targetRole.nombre))) throw new Error('ROLE_ASSIGNMENT_DENIED');

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } });
    if (createError || !created.user) throw new Error(createError?.message ?? 'CREATE_USER_FAILED');

    const { error: profileInsertError } = await admin.from('profiles').insert({ id: created.user.id, nombre, telefono: body.telefono?.trim() || null, rol_id: rolId, activo: true });
    if (profileInsertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileInsertError.message);
    }
    await admin.from('audit_log').insert({ usuario_id: caller.id, accion: 'CREAR_USUARIO', entidad: 'profiles', entidad_id: null, metadata: { usuario_id: created.user.id, email, rol_id: rolId } });
    return new Response(JSON.stringify({ ok: true, user_id: created.user.id }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'PERMISSION_DENIED' ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: message }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
