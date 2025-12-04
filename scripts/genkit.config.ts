import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Load environment variables from .env
config();

// Import your flows so Genkit can discover them
import './src/ai/flows/daily-challenge-generation';
import './src/ai/flows/manage-problems-flow';

export default configureGenkit({
  plugins: [googleAI()],
});