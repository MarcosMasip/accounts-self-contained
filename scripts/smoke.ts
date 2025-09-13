/*
  Orchestrated smoke test runner.
  - compiles packages (handled by npm script)
  - starts docker databases
  - runs e2e tests (REST + GraphQL password)
  - tears down docker databases
*/

/* eslint-disable no-console */
import { spawn } from 'child_process';

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  // Bring up local databases
  console.log('Starting local databases with docker compose...');
  await run('docker', ['compose', 'up', '-d']);

  try {
    // Give services a moment to be ready
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Running e2e tests as smoke...');
    // Reuse the packages/e2e test suite as a smoke test
    await run('yarn', ['workspace', '@accounts/e2e', 'coverage']);

    console.log('\nSmoke tests passed.');
  } finally {
    console.log('Tearing down local databases...');
    // Always tear down to keep environment clean
    try {
      await run('docker', ['compose', 'down', '-v']);
    } catch (e) {
      console.warn('Failed to shutdown docker compose cleanly:', e);
    }
  }
}

main().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
