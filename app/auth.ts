import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateAuthSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    // Keep /login reachable so a missing deployment configuration does not create a redirect loop.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user && pathname !== '/login' && !pathname.startsWith('/_next')) return NextResponse.redirect(new URL('/login', request.url));
  if (user && pathname === '/login') return NextResponse.redirect(new URL('/', request.url));
  return response;
}
