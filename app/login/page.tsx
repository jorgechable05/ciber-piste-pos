import { cookies } from 'next/headers';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  // Read the request cookie store so the route is unambiguously request-dynamic.
  // Authentication itself is handled by the server route and Supabase session proxy.
  await cookies();
  return <main className="auth-shell"><LoginForm /></main>;
}
