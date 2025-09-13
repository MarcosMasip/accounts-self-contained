import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AccountsServer, AuthenticationServicesToken, ServerHooks } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import accountsExpress, { userLoader } from '@accounts/rest-express';
import { createApplication } from 'graphql-modules';
import { createAccountsCoreModule } from '@accounts/module-core';
import { createAccountsPasswordModule } from '@accounts/module-password';
import { createAccountsMongoModule } from '@accounts/module-mongo';
import { Mongo } from '@accounts/mongo';
import fs from 'node:fs';
import path from 'node:path';

async function start() {
  const useMemory = process.env.MONGO_INMEMORY === '1';
  let mongoServer: MongoMemoryServer | undefined;
  if (useMemory) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  } else {
    await mongoose.connect(
      process.env.MONGO_URL || 'mongodb://localhost:27017/accounts-js-rest-example'
    );
  }
  const dbConn = mongoose.connection;

  // When using in-memory DB, auto-seed a demo user so login works out of the box.
  // This mirrors tools/seed but reuses the same db connection to avoid a separate in-memory instance.
  if (useMemory && (process.env.ACCOUNTS_AUTOSEED === '1' || shouldMirrorSeedMarker())) {
    try {
      const accountsDb = new Mongo(dbConn as any);
      const { email, password } = readSeedMarker() || {
        email: process.env.DEMO_EMAIL || 'demo@example.com',
        password: process.env.DEMO_PASSWORD || 'changeme',
      };
      const existing = await accountsDb.findUserByEmail?.(email);
      if (!existing) {
        const tempPassword = new AccountsPassword();
        const tempServer = new (AccountsServer as any)(
          { tokenSecret: 'dev-auto-seed' },
          { password: tempPassword },
          accountsDb
        );
        await tempPassword.createUser({
          email,
          password,
          profile: { firstName: 'Demo', lastName: 'User' },
        } as any);
        console.log(`['dev:auto'] Seeded demo user for in-memory DB (${email} / ${password})`);
      }
    } catch (e) {
      console.warn('[dev:auto] Demo user auto-seed skipped:', (e as Error)?.message || e);
    }
  }

  function seedMarkerPath() {
    const repoRoot = path.resolve(__dirname, '../../..');
    return path.join(repoRoot, '.tmp', 'seed-inmemory.json');
  }
  function readSeedMarker(): { email: string; password: string } | null {
    try {
      const file = seedMarkerPath();
      if (!fs.existsSync(file)) return null;
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return { email: data.email, password: data.password };
    } catch {
      return null;
    }
  }
  function shouldMirrorSeedMarker(): boolean {
    // Mirror only if a prior in-memory seed marker exists (from tools/seed) and user didn't set ACCOUNTS_AUTOSEED explicitly
    return !!readSeedMarker();
  }

  const app = createApplication({
    modules: [
      createAccountsCoreModule({ tokenSecret: 'secret' }),
      createAccountsPasswordModule({
        // This option is called when a new user create an account
        // Inside we can apply our logic to validate the user fields
        validateNewUser: (user) => {
          if (!user.firstName) {
            throw new Error('First name required');
          }
          if (!user.lastName) {
            throw new Error('Last name required');
          }

          // For example we can allow only some kind of emails
          if (user.email.endsWith('.xyz')) {
            throw new Error('Invalid email');
          }
          return user;
        },
      }),
      createAccountsMongoModule({ dbConn }),
    ],
    providers: [
      {
        provide: AuthenticationServicesToken,
        useValue: { password: AccountsPassword },
        global: true,
      },
    ],
  });

  const expressApp = express();

  expressApp.use(bodyParser.json());
  expressApp.use(bodyParser.urlencoded({ extended: true }));
  expressApp.use(cors());

  // Friendly GET for /accounts so direct browser visits don't show "Cannot GET /accounts".
  // Real REST operations are still under /accounts/* (mostly POST); this handler is just informational.
  expressApp.get('/accounts', (req, res) => {
    const host = (req.headers.host as string) || 'localhost:4000';
    res
      .type('text/plain')
      .send(
        'Accounts REST API is running.\n' +
          'This route is informational. Common endpoints (POST):\n' +
          '  - /accounts/login\n' +
          '  - /accounts/logout\n' +
          '  - /accounts/refreshTokens\n' +
          '  - /accounts/createUser\n' +
          '  - /accounts/sendResetPasswordEmail\n' +
          `Visit the app at http://${host}/ (the UI is proxied in development).\n`
      );
  });

  // Helpful GET handler for any /accounts/* path to explain that these endpoints expect POST.
  expressApp.get('/accounts/*', (req, res) => {
    const host = (req.headers.host as string) || 'localhost:4000';
    const url = `http://${host}${req.path}`;
    const path = req.path;
    let exampleBody = '';
    if (path.endsWith('/login')) {
      exampleBody = `-H 'Content-Type: application/json' \\\n  -d '{"user":{"email":"john@example.com"},"password":"1234567"}'`;
    } else if (path.endsWith('/logout')) {
      exampleBody = `-H 'Authorization: Bearer <accessToken>'`;
    } else if (path.endsWith('/refreshTokens')) {
      exampleBody = `-H 'Content-Type: application/json' \\\n  -d '{"accessToken":"<accessToken>","refreshToken":"<refreshToken>"}'`;
    } else if (path.endsWith('/createUser')) {
      exampleBody = `-H 'Content-Type: application/json' \\\n  -d '{"user":{"email":"john@example.com","password":"1234567","firstName":"John","lastName":"Doe"}}'`;
    } else if (path.endsWith('/sendResetPasswordEmail')) {
      exampleBody = `-H 'Content-Type: application/json' \\\n  -d '{"email":"john@example.com"}'`;
    }
    res
      .type('text/plain')
      .send(
        `This endpoint expects a POST request, not GET.\n\n` +
          `Try from a terminal:\n` +
          `  curl -s -X POST ${url} ${exampleBody}\n\n` +
          `Note: Use the app at http://${host}/ for an in-browser experience.\n`
      );
  });

  interface UserDoc extends mongoose.Document {
    firstName: string;
    lastName: string;
  }

  const User = mongoose.model<UserDoc>(
    'User',
    new mongoose.Schema({ firstName: String, lastName: String })
  );

  const controller = app.createOperationController({
    context: {},
  });
  const accountsServer = controller.injector.get(AccountsServer);

  accountsServer.on(ServerHooks.ValidateLogin, ({ user }) => {
    // This hook is called every time a user try to login.
    // You can use it to only allow users with verified email to login.
    // If you throw an error here it will be returned to the client.
    console.log('Logged in', user);
  });

  /**
   * Load and expose the accounts-js middleware
   */
  expressApp.use(accountsExpress(accountsServer));

  /**
   * Return the current logged in user
   */
  expressApp.get('/user', userLoader(accountsServer), (req, res) => {
    res.json({ user: (req as any).user });
  });

  /**
   * Expose a public route to edit user informations
   * - route is protected
   * - update the current logged in user in the db
   */
  expressApp.put('/user', userLoader(accountsServer), async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401);
      res.json({ message: 'Unauthorized' });
      return;
    }
    const user = await User.findById(userId).exec();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    await user.save();
    res.json(true);
  });

  // In development, proxy the UI through this server so users only visit one port.
  if (process.env.NODE_ENV !== 'production') {
    const target = process.env.UI_PROXY_TARGET || 'http://localhost:3000';
    const uiProxy = createProxyMiddleware({ target, changeOrigin: true, ws: true });
    // Only proxy non-API GET routes (fallback to UI dev server)
    expressApp.use((req, res, next) => {
      const pathname = req.path || req.url;
      if (req.method !== 'GET') return next();
      if (pathname.startsWith('/accounts')) return next();
      if (pathname.startsWith('/user')) return next();
      if (pathname.startsWith('/reset')) return next();
      return uiProxy(req, res, next);
    });
  } else {
    /**
     * Friendly root route to indicate the API is running (production fallback).
     */
    expressApp.get('/', (_req, res) => {
      res
        .type('text/plain')
        .send(
          'Accounts REST API is running. The API root is mounted at /accounts.\n' +
            'Build and serve the React app or use requests to /accounts/* endpoints.'
        );
    });
  }

  const desiredPort = Number(process.env.PORT) || 4000;
  const startOnPort = (port: number) =>
    new Promise<{ server: import('http').Server | import('https').Server; port: number }>(
      (resolve, reject) => {
        const server = expressApp.listen(port, () => resolve({ server, port }));
        server.on('error', (err: any) => {
          if (err && err.code === 'EADDRINUSE') {
            // Try next port
            resolve({ server, port: -1 });
          } else {
            reject(err);
          }
        });
      }
    );

  let server: import('http').Server | import('https').Server | undefined;
  let actualPort = desiredPort;
  for (let i = 0; i < 5; i++) {
    const res = await startOnPort(actualPort);
    if (res.port !== -1) {
      server = res.server;
      actualPort = res.port;
      break;
    }
    // close the failed server and increment
    res.server.close();
    actualPort += 1;
  }
  if (!server) {
    throw new Error(`Could not bind a port near ${desiredPort}.`);
  }
  const siteUrl = `http://localhost:${actualPort}`;
  const dbMode = useMemory ? 'In-memory MongoDB' : 'MongoDB (Docker/local)';
  const uiTarget = process.env.UI_PROXY_TARGET || 'http://localhost:3000';
  const banner = [
    '────────────────────────────────────────────────────────',
    'Accounts.js - REST stack (dev)',
    `Server:               ${siteUrl}`,
    `UI (open in browser): ${siteUrl}/`,
    `REST API (POST):      ${siteUrl}/accounts/*`,
    `UI dev server:        ${uiTarget} (proxied)`,
    `Database:             ${dbMode}`,
    'Tip: Open the UI at the exact URL above. Use POST requests to /accounts/* for the API.',
    '────────────────────────────────────────────────────────',
  ].join('\n');
  console.log('\n' + banner + '\n');

  const shutdown = async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
