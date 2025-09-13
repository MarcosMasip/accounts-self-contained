#!/usr/bin/env node
/*
 * Unified dev launcher: prefers Docker; falls back to in-memory Mongo automatically.
 * Interactive by default to avoid multiple terminals.
 * Usage:
 *   node scripts/dev-auto.js            # prompts: pick REST or GraphQL stack
 *   node scripts/dev-auto.js rest       # force REST stack
 *   node scripts/dev-auto.js gql        # force GraphQL stack
 *   STACK=gql node scripts/dev-auto.js  # also supported via env var
 */
const { spawnSync, spawn } = require('node:child_process');
const readline = require('node:readline');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return res.status === 0;
}

function whichDocker() {
  const info = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (info.status !== 0) return null;
  // Prefer `docker compose` (v2), fallback to `docker-compose` (v1)
  const v2 = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' });
  if (v2.status === 0)
    return { cmd: 'docker', argsUp: ['compose', 'up', '-d'], argsDown: ['compose', 'down', '-v'] };
  const v1 = spawnSync('docker-compose', ['--version'], { stdio: 'ignore' });
  if (v1.status === 0)
    return { cmd: 'docker-compose', argsUp: ['up', '-d'], argsDown: ['down', '-v'] };
  return null;
}

(async function main() {
  // Determine mode from argv, env, or prompt.
  const arg = (process.argv[2] || '').toLowerCase();
  const envStack = (process.env.STACK || process.env.ACCOUNTS_STACK || '').toLowerCase();
  let mode;

  const normalize = (m) => (m === 'gql' || m === 'graphql' ? 'gql' : m === 'rest' ? 'rest' : '');
  const fromArg = normalize(arg);
  const fromEnv = normalize(envStack);

  if (fromArg) mode = fromArg;
  else if (fromEnv) mode = fromEnv;
  else if (process.stdin.isTTY) {
    mode = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(
        '\nWhich stack to run?\n  [1] REST (server + React UI)\n  [2] GraphQL (server + React UI)\nSelect 1 or 2: ',
        (answer) => {
          rl.close();
          const choice = String(answer || '').trim();
          if (choice === '2' || /^g(q|ql)?$/i.test(choice)) return resolve('gql');
          return resolve('rest');
        }
      );
    });
  } else {
    mode = 'rest';
  }

  console.log(`[dev:auto] Selected stack: ${mode === 'gql' ? 'GraphQL' : 'REST'}`);

  (async () => {
    // 1) Try Docker first
    let useDocker = false;
    const docker = whichDocker();
    if (docker) {
      console.log('[dev:auto] Docker detected, starting databases with compose...');
      useDocker = run(docker.cmd, docker.argsUp);
      if (!useDocker) {
        console.warn('[dev:auto] Docker compose failed, falling back to in-memory Mongo.');
      }
    } else {
      console.warn('[dev:auto] Docker not available, using in-memory Mongo.');
    }

    // 2) Compile (type generation, TS builds)
    console.log('[dev:auto] Compiling workspaces...');
    if (!run('yarn', ['compile'])) {
      process.exit(1);
    }

    // 3) Start processes
    const labels = mode === 'gql' ? 'GRAPHQL,WEB' : 'REST,WEB';
    const colors = mode === 'gql' ? 'magenta,cyan' : 'green,cyan';
    const procs = [];
    const env = { ...process.env };
    if (!useDocker) {
      // No containers: use in-memory DB for server
      env.MONGO_INMEMORY = '1';
    } else {
      // Containers up: point server to the same DB name the seed uses by default
      // so `yarn seed:mongo` -> `yarn dev` shares the same database.
      if (!env.MONGO_URL) {
        env.MONGO_URL = 'mongodb://localhost:27017/accounts-js-seed';
      }
    }

    const serverCmd =
      mode === 'gql'
        ? 'yarn workspace @examples/graphql-server-typescript start'
        : 'yarn workspace @examples/rest-express-typescript start';
    const webCmd =
      mode === 'gql'
        ? 'yarn workspace @examples/react-graphql-typescript dev -- --port 3000 --strictPort'
        : 'yarn workspace @examples/react-rest-typescript dev -- --port 3000 --strictPort';

    // Use concurrently for nice labels and aggregated logs
    const args = ['run', '-T', 'concurrently', '-n', labels, '-c', colors, serverCmd, webCmd];

    const c = spawn('yarn', args, { stdio: 'inherit', env });
    procs.push(c);

    const onSig = () => {
      procs.forEach((p) => p.kill());
      // No docker down on SIGINT to avoid tearing down user DBs unexpectedly
      process.exit(0);
    };
    process.on('SIGINT', onSig);
    process.on('SIGTERM', onSig);
  })();
})();
