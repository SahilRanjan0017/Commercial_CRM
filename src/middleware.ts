import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 🔹 Extract token from Authorization header
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  // Define protected routes
  const protectedRoutes = ["/", "/journey-360", "/are", "/range-calculator", "/overall-view"]
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === "/") return pathname === "/"
    return pathname === route || pathname.startsWith(route + "/")
  })

  const isPublicAuthRoute = ["/login", "/signup"].includes(pathname)

  if (!token && isProtectedRoute) {
    // ❌ No token → redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (token) {
    // 🔹 Create a temporary Supabase client (no cookies, just token)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🔹 Validate the token with Supabase
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      console.error("Invalid or expired token:", error?.message)

      // ❌ Invalid token → redirect to login
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // ✅ User is authenticated
    if (isPublicAuthRoute) {
      // Prevent logged-in users from accessing /login or /signup
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    return response
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
