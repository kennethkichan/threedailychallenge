import { execSync } from 'child_process';

/**
 * A robust wrapper for executing Genkit flows from the command line.
 * It correctly assembles the `genkit flow:run` command with dynamic input.
 */
function runFlow() {
  // The first two args are 'tsx' and the script name.
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Error: You must provide a flow name to run.');
    console.error("   Usage: npm run flow -- <flowName> '[jsonData]'");
    process.exit(1);
  }

  const flowName = args[0];
  // The JSON input is optional. If not provided, it's an empty string.
  const flowInput = args[1] || "''"; // Default to empty single quotes

  // Construct the command, ensuring the input is wrapped in single quotes for the shell.
  const command = `genkit flow:run '${flowName}' ${flowInput}`;

  console.log(`🚀 Executing: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Flow execution failed.');
    process.exit(1);
  }
}

runFlow();