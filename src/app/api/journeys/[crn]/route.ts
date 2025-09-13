
import { NextRequest, NextResponse } from 'next/server';
import { getJourney, getStageForCrn, updateJourney } from '@/services/supabase';
import type { CustomerJourney } from '@/types';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ crn: string }> }
) {
   const { params } = context;
  const { crn } = await params; 
  try {
    const cookieStore = cookies();
    const stage = await getStageForCrn(crn, cookieStore);
    if (!stage) {
      return NextResponse.json({ message: `Journey with CRN ${crn} not found` }, { status: 404 });
    }
    return NextResponse.json(stage);
  } catch (error) {
    console.error(`Error fetching stage for CRN ${crn}:`, error);
    return NextResponse.json({ message: 'Error fetching journey stage' }, { status: 500 });
  }
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ crn: string }> }
) {
  const { params } = context;
  const { crn } = await params;  
  const newJourneyDetails = await request.json();
  try {
    const cookieStore = cookies();
    const journey = await getJourney(crn, newJourneyDetails, cookieStore);
    return NextResponse.json(journey);
  } catch (error) {
    console.error(`Error loading journey for CRN ${crn}:`, error);
    return NextResponse.json({ message: 'Error loading journey' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ crn: string }> }
) {
    const { params } = context;
    const { crn } = await params; 
    const journey: CustomerJourney = await request.json();
    if (crn !== journey.crn) {
        return NextResponse.json({ message: 'CRN in URL and body do not match' }, { status: 400 });
    }
    try {
        const cookieStore = cookies();
        await updateJourney(journey, cookieStore);
        return NextResponse.json({ message: 'Journey updated successfully' });
    } catch (error) {
        console.error(`Error updating journey for CRN ${crn}:`, error);
        return NextResponse.json({ message: 'Error updating journey' }, { status: 500 });
    }
}
