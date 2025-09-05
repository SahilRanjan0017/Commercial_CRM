'use server';
// IMPORTANT: We need to list all of our flows here so that they are included in the production bundle.

import { createFlowsEndpoint } from '@genkit-ai/next/server';
import { ai } from '@/ai/genkit';

export const { GET, POST } = createFlowsEndpoint({
  ai,
});
