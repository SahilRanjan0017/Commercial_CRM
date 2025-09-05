
import { NextResponse } from 'next/server';
import { sendTDDMWebhook } from '@/services/webhook';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const result = await sendTDDMWebhook(data);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error processing TDDM webhook:', error);
        return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 });
    }
}
