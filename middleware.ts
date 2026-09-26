import { NextRequest } from 'next/server';
import { updateAuthSession } from './app/auth';

export async function middleware(request: NextRequest) {
  return updateAuthSession(request);
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
