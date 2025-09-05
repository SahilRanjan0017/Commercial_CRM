
import { NextResponse } from 'next/server';
import { getAllJourneys } from '@/services/supabase';

export async function GET() {
  try {
    const journeys = await getAllJourneys();
    return NextResponse.json(journeys);
  } catch (error) {
    console.error('Error fetching all journeys:', error);
    return NextResponse.json({ message: 'Error fetching journeys' }, { status: 500 });
  }
}
