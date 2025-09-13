

import type { TDDMInitialMeetingData } from '@/types';
import { format } from 'date-fns';

const WEBHOOK_URL = 'https://hook.us2.make.com/rk1l7tedku5j4ycn2pjbrx2vtgu5a6s3';

export async function sendTDDMWebhook(data: TDDMInitialMeetingData & { customerName?: string, customerEmail?: string, customerPhone?: string }) {
  const payload = {
      crn: data.stage.crn,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      osEmail: data.osEmail,
      tddmDate: format(new Date(data.tddmDate), 'yyyy-MM-dd'),
      meetingLocation: data.meetingLocation,
      attendance: data.attendance,
      attendeeBnb: data.attendeeBnb,
      duration: data.duration,
      drawingShared: data.drawingShared,
      boqShared: data.boqShared,
      byeLawsDiscussed: data.byeLawsDiscussed,
      sampleFlowPlansDiscussed: data.sampleFlowPlansDiscussed,
      roiDiscussed: data.roiDiscussed,
      expectedClosureDate: format(new Date(data.expectedClosureDate), 'yyyy-MM-dd'),
      nextStepBrief: data.nextStepBrief,
      nextStepEta: data.nextStepEta ? format(new Date(data.nextStepEta), 'yyyy-MM-dd') : undefined,
      customerLikes: data.customerLikes,
      mom: data.mom,
      user: data.user,
      timestamp: data.timestamp,
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
    }

    console.log('TDDM webhook sent successfully');
    // Make.com webhooks typically return "Accepted" as plain text.
    const result = await response.text();
    console.log('Webhook response:', result);
    return { success: true, message: result };
    
  } catch (error) {
    console.error('Error sending TDDM webhook:', error);
    throw new Error('Failed to send TDDM webhook.');
  }
}
