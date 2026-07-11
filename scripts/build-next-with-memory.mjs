import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const heapMb = process.env.AK_NEXT_BUILD_HEAP_MB || '4096';
const existingNodeOptions = process.env.NODE_OPTIONS || '';
const hasHeapOption = /\b--max-old-space-size=/.test(existingNodeOptions);
const nodeOptions = hasHeapOption
  ? existingNodeOptions
  : `${existingNodeOptions} --max-old-space-size=${heapMb}`.trim();

const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
    NODE_OPTIONS: nodeOptions,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[build-next-with-memory] Failed to start Next build:', error);
  process.exit(1);
});
