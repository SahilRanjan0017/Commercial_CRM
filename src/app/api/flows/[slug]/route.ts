'use server';
// IMPORTANT: We need to list all of our flows here so that they are included in the production bundle.

import { NextResponse } from 'next/server';

export const POST = async () => {
  return NextResponse.json({ message: 'No flows defined' });
};
