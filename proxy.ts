import { NextRequest } from 'next/server';
import { updateAuthSession } from './app/auth';

export async function proxy(request: NextRequest) {
  return updateAuthSession(request);
}

// DEMO must remain completely isolated from authentication/Supabase so it can
// be shown and tested without production credentials or sessions.
export const config = { matcher: ['/((?!demo(?:/|$)|api|_next/static|_next/image|favicon.ico).*)'] };
