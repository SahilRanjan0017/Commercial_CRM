import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Define which routes are protected
const protectedRoutes = ['/','/journey-360','/are','/range-calculator', '/overall-view']

export async function middleware(req: NextRequest) {
  const supabase = createClient()

  // Get user session from Supabase
  const { data: { user }, error } = await supabase.auth.getUser()

  const url = req.nextUrl.clone()
  const isProtectedRoute = protectedRoutes.some(path => url.pathname === path)

  // if user is not logged in and is trying to access a protected route
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // if user is logged in and tries to access login or signup, redirect to home
  if (user && (url.pathname === '/login' || url.pathname === '/signup')) {
      url.pathname = '/'
      return NextResponse.redirect(url)
  }

  // User is logged in or accessing a public route, allow access
  return NextResponse.next()
}

// Specify which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/confirm (for email verification)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/confirm).*)',
  ],
}
