import { createBrowserClient } from '@supabase/ssr'

const BUILD_SAFE_URL = 'https://example.supabase.co'
const BUILD_SAFE_KEY = 'sb_publishable_build_placeholder'

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (typeof window === 'undefined') {
    return createBrowserClient(url || BUILD_SAFE_URL, key || BUILD_SAFE_KEY)
  }

  if (!url || !key) {
    throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return createBrowserClient(url, key)
}
