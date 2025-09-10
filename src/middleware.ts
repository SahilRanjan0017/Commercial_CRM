import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = req.nextUrl.clone()

  const protectedRoutes = ['/', '/journey-360', '/are', '/range-calculator', '/overall-view']
  const isProtectedRoute = protectedRoutes.includes(url.pathname)

  // If user not logged in & trying to visit protected page → redirect to /login
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in & trying to go to /login or /signup → redirect home
  if (user && (url.pathname === '/login' || url.pathname === '/signup')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return res
}

// Run middleware on all routes except static files, images, favicon, etc.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/confirm).*)',
  ],
}
