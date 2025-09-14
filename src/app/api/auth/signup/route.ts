// src/app/api/auth/signup/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse JSON instead of formData
    const body = await request.json()
    const { email, password, full_name, role, city } = body

    if (!email || !password || !full_name || !role || !city) {
      return NextResponse.json(
        { message: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role, city }
      }
    })

    if (error) {
      console.error('Signup Error:', error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Email confirmation flow
    if (data.user && !data.user.email_confirmed_at) {
      return NextResponse.json({
        message: 'Signup successful! Please check your email to verify your account before logging in.'
      })
    } else {
      return NextResponse.json({ message: 'Account created successfully! You can now log in.' })
    }
  } catch (error) {
    console.error('Unexpected signup error:', error)
    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
