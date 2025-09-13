// src/app/api/auth/login/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log("Login request received");
  const contentType = request.headers.get('content-type') || ''
  let email = ''
  let password = ''
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json()
      email = body.email ?? ''
      password = body.password ?? ''
    } else {
      const formData = await request.formData()
      email = (formData.get('email') as string) || ''
      password = (formData.get('password') as string) || ''
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: 'Invalid request payload' },
      { status: 400 }
    )
  }
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: 'Email and password are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({
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
    return NextResponse.json({ ok: false, message }, { status: 401 })
  }

  // Ensure cookies are available before redirect
  await supabase.auth.getSession()

  // Successful login
  return NextResponse.json({ ok: true, message: 'Login successful', data:data })
}