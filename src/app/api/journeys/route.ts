
import { NextResponse } from 'next/server';
import { getAllJourneys } from '@/services/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const journeys = await getAllJourneys(cookieStore);
    return NextResponse.json(journeys);
  } catch (error) {
    console.error('Error fetching all journeys:', error);
    return NextResponse.json({ message: 'Error fetching journeys' }, { status: 500 });
  }
}
