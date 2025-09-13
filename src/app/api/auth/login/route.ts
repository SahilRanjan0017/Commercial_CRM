// src/app/api/auth/login/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Email and password are required')
      return NextResponse.redirect(redirectUrl)
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login Error:', error)
      let message = 'An error occurred during login'
      
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please check your email and confirm your account before logging in'
      } else {
        message = error.message
      }
      
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', message)
      return NextResponse.redirect(redirectUrl)
    }

    if (!data.user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Authentication failed. Please try again.')
      return NextResponse.redirect(redirectUrl)
    }

    // Successful login - redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
    
  } catch (error) {
    console.error('Unexpected login error:', error)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.')
    return NextResponse.redirect(redirectUrl)
  }
}