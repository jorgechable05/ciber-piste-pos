import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuración de Supabase no disponible en Vercel.' }, { status: 503 });
  }

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
