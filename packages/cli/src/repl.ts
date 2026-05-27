import { createInterface } from 'node:readline';
import type { CliFlags } from './flags.js';

export async function runRepl(_flags: CliFlags): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'expo> ',
  });

  let ctrlCCount = 0;

  rl.on('SIGINT', () => {
    ctrlCCount++;
    if (ctrlCCount >= 2) {
      process.stdout.write('\nExiting...\n');
      rl.close();
      return;
    }
    process.stdout.write('\n(Press Ctrl+C again to exit)\n');
    rl.prompt();
  });

  rl.on('line', (line: string) => {
    ctrlCCount = 0;
    const input = line.trim();

    if (input.length === 0) {
      rl.prompt();
      return;
    }

    // Stub: session orchestrator dispatch will go here
    process.stdout.write(`[stub] received: ${input}\n`);
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });

  rl.prompt();
}
