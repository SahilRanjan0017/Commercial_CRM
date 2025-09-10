import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createClient } from './utils/supabase/server'


export async function middleware(request: NextRequest) {
    // First, run updateSession to handle session refresh logic.
    // This will return a response with the updated session cookie if needed.
    const response = await updateSession(request);

    // Now, create a Supabase client with the (potentially updated) cookies from the response.
    // This allows us to check the user's authentication status reliably.
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    // If the user is not logged in and is trying to access a protected route,
    // redirect them to the login page.
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        !request.nextUrl.pathname.startsWith('/auth/confirm') &&
        !request.nextUrl.pathname.startsWith('/error')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
    
    // If the user is authenticated or is accessing a public route,
    // allow the request to proceed with the response from updateSession.
    return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
