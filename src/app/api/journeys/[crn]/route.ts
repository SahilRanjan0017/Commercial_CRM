
import { NextResponse } from 'next/server';
import { getJourney, getStageForCrn, updateJourney } from '@/services/supabase';
import type { CustomerJourney } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { crn: string } }
) {
  const crn = params.crn;
  try {
    const stage = await getStageForCrn(crn);
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
  request: Request,
  { params }: { params: { crn: string } }
) {
  const crn = params.crn;
  const newJourneyDetails = await request.json();
  try {
    const journey = await getJourney(crn, newJourneyDetails);
    return NextResponse.json(journey);
  } catch (error) {
    console.error(`Error loading journey for CRN ${crn}:`, error);
    return NextResponse.json({ message: 'Error loading journey' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { crn: string } }
) {
    const journey: CustomerJourney = await request.json();
    if (params.crn !== journey.crn) {
        return NextResponse.json({ message: 'CRN in URL and body do not match' }, { status: 400 });
    }
    try {
        await updateJourney(journey);
        return NextResponse.json({ message: 'Journey updated successfully' });
    } catch (error) {
        console.error(`Error updating journey for CRN ${params.crn}:`, error);
        return NextResponse.json({ message: 'Error updating journey' }, { status: 500 });
    }
}
