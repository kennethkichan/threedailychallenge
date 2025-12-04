import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { dotprompt } from '@genkit-ai/dotprompt';
import { firebase } from '@genkit-ai/firebase';
import { config } from 'dotenv';

config();

import './src/ai/flows/daily-challenge-generation';
import './src/ai/flows/manage-problems-flow';

export default configureGenkit({
  plugins: [
    dotprompt(), 
    firebase(), 
    googleAI()
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
