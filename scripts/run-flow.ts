
import { configureGenkit } from '@genkit-ai/core';
import { runFlow } from '@genkit-ai/flow';
import { Command } from 'commander';
import config from './genkit.config';
import { generateProblemsFlow, reviewProblemsFlow } from '../src/ai/flows/manage-problems-flow';

/**
 * A robust wrapper for executing Genkit flows programmatically.
 * It initializes Genkit and then runs the specified flow with the given input.
 */
async function run() {
  // Must be called before anything else.
  await configureGenkit({
    ...config,
    // The programmatic runner should not expose a UI.
    enableDevUi: false,
    telemetry: {
      instrumentation: {
        // The programmatic runner should not need to expose a server.
        express: false,
      },
    },
  });

  const program = new Command();

  program
    .command('generateProblemsFlow')
    .description('Generate new problems based on predefined tasks.')
    .argument('[jsonData]', 'JSON input for the flow', '{}') // Default to empty JSON object
    .action(async (jsonData) => {
      try {
        const input = JSON.parse(jsonData);
        const result = await runFlow(generateProblemsFlow, input);
        console.log('✅ Flow executed successfully:', result);
      } catch (error) {
        console.error('❌ Error executing generateProblemsFlow:', error);
        process.exit(1);
      }
    });

  program
    .command('reviewProblemsFlow')
    .description("Review all problems with a 'pending' or 'disputed' status.")
    .action(async () => {
      try {
        const result = await runFlow(reviewProblemsFlow);
        console.log('✅ Flow executed successfully:', result);
      } catch (error) {
        console.error('❌ Error executing reviewProblemsFlow:', error);
        process.exit(1);
      }
    });

  // Modify the `flow` script in package.json to call this script like:
  // "flow": "tsx --tsconfig tsconfig.json scripts/run-flow.ts"
  // And then you can run flows like:
  // npm run flow -- generateProblemsFlow '{"countPerTask": 2}'
  // npm run flow -- reviewProblemsFlow

  await program.parseAsync(process.argv);
}

run().catch((e) => {
  console.error('❌ An unexpected error occurred:', e);
  process.exit(1);
});
