// src/app/api/auth/login/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Create a response object that we can modify
  const response = NextResponse.redirect(requestUrl.origin)
  
  const supabase = createClient(request, response)

  if (!email || !password) {
    return NextResponse.redirect(`${requestUrl.origin}/login?message=Email and password are required`, {
      status: 302,
    })
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let message = 'An error occurred during login'
    if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Please check your email and confirm your account before logging in'
    } else {
      message = error.message
    }
     return NextResponse.redirect(`${requestUrl.origin}/login?message=${encodeURIComponent(message)}`, {
      status: 302,
    })
  }

  // Successful login - redirect to home page, the cookies are already set on the response object
  return NextResponse.redirect(`${requestUrl.origin}/`, {
    status: 302,
  })
}
