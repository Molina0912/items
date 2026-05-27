import type { CliFlags } from './flags.js';

export async function runHeadless(_flags: CliFlags): Promise<void> {
  const chunks: Buffer[] = [];

  const input = await new Promise<string>((resolve) => {
    process.stdin.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
  });

  // Stub: echo back the input for now (will be replaced by session orchestrator)
  const trimmed = input.trim();
  if (trimmed.length > 0) {
    process.stdout.write(trimmed + '\n');
  }
}
