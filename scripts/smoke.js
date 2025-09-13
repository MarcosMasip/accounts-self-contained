/*
  Orchestrated smoke test runner.
  - starts docker databases
  - runs e2e tests (REST + GraphQL password)
  - tears down docker databases
*/

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  // Ensure a local tmp directory to avoid ENOSPC in system temp
  const repoRoot = path.resolve(__dirname, '..');
  const localTmp = path.join(repoRoot, '.tmp');
  try {
    fs.mkdirSync(localTmp, { recursive: true });
  } catch (_) {}
  process.env.TMPDIR = process.env.TMPDIR || localTmp;
  process.env.TMP = process.env.TMP || localTmp;
  process.env.TEMP = process.env.TEMP || localTmp;

  let dockerAvailable = true;
  console.log('Starting local databases with docker compose...');
  try {
    try {
      await run('docker', ['compose', 'up', '-d']);
    } catch (_) {
      // Fallback for older setups
      await run('docker-compose', ['up', '-d']);
    }
  } catch (e) {
    dockerAvailable = false;
    console.warn('Docker not available or not running. Proceeding without containers...');
  }

  try {
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Running e2e tests as smoke...');
    const envPrefix = process.platform === 'win32' ? 'set' : 'env';
    // If docker wasn't started, prefer in-memory mongo for the e2e run.
    const useInMemory = !dockerAvailable;
    if (useInMemory) {
      process.env.MONGO_INMEMORY = '1';
    }
    await run('yarn', ['workspace', '@accounts/e2e', 'coverage']);

    console.log('\nSmoke tests passed.');
  } finally {
    if (dockerAvailable) {
      console.log('Tearing down local databases...');
      try {
        try {
          await run('docker', ['compose', 'down', '-v']);
        } catch (_) {
          await run('docker-compose', ['down', '-v']);
        }
      } catch (e) {
        console.warn('Failed to shutdown docker compose cleanly:', e);
      }
    }
  }
}

main().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
