
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, type NextResponse } from 'next/server'

export function createClient(request?: NextRequest, response?: NextResponse) {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request ? request.cookies.get(name)?.value : cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            if (request && response) {
              response.cookies.set({ name, value, ...options })
            } else {
              await cookieStore.set({ name, value, ...options })
            }
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
             if (request && response) {
              response.cookies.set({ name, value: '', ...options })
            } else {
              await cookieStore.set({ name, value: '', ...options })
            }
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
