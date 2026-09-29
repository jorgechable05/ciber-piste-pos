import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuthqwuvzftrxnamwjcr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_S8KDAN4sNafGoTMVpou_Ng_Ok5Iqmjs';

const PUBLIC_PATHS = ['/login'];

export async function middleware(request: Request & { cookies: { getAll: () => { name: string; value: string }[]; set: (name: string, value: string, options?: Record<string, unknown>) => void }) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(request.url);
  const isPublic = PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith('/api/auth/');

  if (!user && !isPublic) {
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user && url.pathname === '/login') {
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
