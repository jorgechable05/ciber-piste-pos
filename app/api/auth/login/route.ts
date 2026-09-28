import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

// CIBER PISTE POS: the Supabase publishable key is safe for public/browser use.
// The deployment can still override these values with Vercel environment variables.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuthqwuvzftrxnamwjcr.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_S8KDAN4sNafGoTMVpou_Ng_Ok5Iqmjs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son obligatorios.' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.headers.get('cookie')?.split('; ').map((item) => {
        const index = item.indexOf('=');
        return index >= 0 ? { name: item.slice(0, index), value: item.slice(index + 1) } : null;
      }).filter(Boolean) as { name: string; value: string }[] || [],
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
  }

  return response;
}
