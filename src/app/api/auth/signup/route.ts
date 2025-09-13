
// src/app/api/auth/signup/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const role = formData.get('role') as string
    const city = formData.get('city') as string

    if (!email || !password || !full_name) {
      const redirectUrl = new URL('/signup', request.url)
      redirectUrl.searchParams.set('message', 'Please fill in all required fields')
      return NextResponse.redirect(redirectUrl)
    }
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
          role: role,
          city: city
        }
      }
    })

    if (error) {
      console.error('Signup Error:', error)
      const redirectUrl = new URL('/signup', request.url)
      redirectUrl.searchParams.set('message', error.message)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Signup successful! Please check your email to verify your account before logging in.')
      return NextResponse.redirect(redirectUrl)
    } else {
      // If email confirmation is disabled, redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Account created successfully! You can now log in.')
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Unexpected signup error:', error)
    const redirectUrl = new URL('/signup', request.url)
    redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.')
    return NextResponse.redirect(redirectUrl)
  }
}
