import 'reflect-metadata';
import {
  authenticated,
  buildSchema,
  context,
  createAccountsCoreModule,
} from '@accounts/module-core';
import { createAccountsPasswordModule } from '@accounts/module-password';
import {
  AccountsPassword,
  infosMiddleware,
  resetPassword,
  resetPasswordForm,
  verifyEmail,
} from '@accounts/password';
import { AccountsServer, AuthenticationServicesToken, ServerHooks } from '@accounts/server';
import gql from 'graphql-tag';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApplication } from 'graphql-modules';
import { createAccountsMongoModule } from '@accounts/module-mongo';
import { createYoga } from 'graphql-yoga';
import { useGraphQLModules } from '@envelop/graphql-modules';
import express from 'express';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

void (async () => {
  // Create database connection (supports in-memory MongoDB)
  const useInMemory = process.env.MONGO_INMEMORY === '1' || process.env.MONGO_INMEMORY === 'true';
  let mongod: MongoMemoryServer | undefined;
  if (useInMemory) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Using in-memory MongoDB at ${uri}`);
  } else {
    await mongoose.connect('mongodb://localhost:27017/accounts-js-graphql-example');
  }
  const dbConn = mongoose.connection;

  const typeDefs = gql`
    type PrivateType @auth {
      field: String
    }

    # Our custom fields to add to the user
    extend input CreateUserInput {
      firstName: String!
      lastName: String!
    }

    extend type User {
      firstName: String!
      lastName: String!
    }

    extend type Query {
      # Example of how to get the userId from the context and return the current logged in user or null
      me: User
      publicField: String
      # You can only query this if you are logged in
      privateField: String @auth
      privateType: PrivateType
      privateFieldWithAuthResolver: String
    }

    extend type Mutation {
      privateMutation: String @auth
      publicMutation: String
    }
  `;

  // TODO: use resolvers typings from codegen
  const resolvers = {
    Query: {
      me: (_, __, ctx) => {
        // ctx.userId will be set if user is logged in
        if (ctx.userId) {
          // We could have simply returned ctx.user instead
          return ctx.injector.get(AccountsServer).findUserById(ctx.userId);
        }
        return null;
      },
      publicField: () => 'public',
      privateField: () => 'private',
      privateFieldWithAuthResolver: authenticated(() => {
        return 'private';
      }),
      privateType: () => ({
        field: () => 'private',
      }),
    },
    Mutation: {
      privateMutation: () => 'private',
      publicMutation: () => 'public',
    },
  };

  const port = Number(process.env.PORT) || 4000;
  const siteUrl = `http://localhost:${port}`;
  const app = createApplication({
    modules: [
      createAccountsCoreModule({ tokenSecret: 'secret', siteUrl }),
      createAccountsPasswordModule({
        requireEmailVerification: true,
        sendVerificationEmailAfterSignup: true,
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
    schemaBuilder: buildSchema({ typeDefs, resolvers }),
  });

  const { injector, createOperationController } = app;

  injector.get(AccountsServer).on(ServerHooks.ValidateLogin, ({ user }) => {
    // This hook is called every time a user try to login.
    // You can use it to only allow users with verified email to login.
    // If you throw an error here it will be returned to the client.
    console.log(`${user.firstName} ${user.lastName} logged in`);
  });

  // Create a Yoga instance with a GraphQL schema.
  const yoga = createYoga({
    plugins: [useGraphQLModules(app)],
    // Provide the app injector in context so resolvers can use ctx.injector
    context: (ctx) => context(ctx, { createOperationController, ctx: { injector } }),
  });

  const yogaRouter = express.Router();
  // GraphiQL specific CSP configuration (only applied to /graphql)
  yogaRouter.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'style-src': ["'self'", 'unpkg.com'],
          'script-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
          'img-src': ["'self'", 'raw.githubusercontent.com'],
        },
      },
    })
  );
  yogaRouter.use(yoga);

  const router = express.Router();
  // By adding the GraphQL Yoga router before the global helmet middleware,
  // you can be sure that the global CSP configuration will not be applied to the GraphQL Yoga endpoint
  router.use(yoga.graphqlEndpoint, yogaRouter);
  // Add the global CSP configuration for the rest of your server.
  router.use(express.urlencoded({ extended: true }));
  // Apply global helmet after we mount the UI proxy in dev to avoid CSP blocking dev assets

  router.use(infosMiddleware);
  router.get('/verify-email/:token', verifyEmail(app.injector));
  router.get('/reset-password/:token', resetPasswordForm);
  router.post('/resetPassword', resetPassword(app.injector));

  const expressApp = express();
  expressApp.use(router);

  // Resolve UI dev server target (for proxy + logs)
  const uiTarget = process.env.UI_PROXY_TARGET || 'http://localhost:3000';

  // In development, proxy the React GraphQL client so users can visit only one port (4000)
  if (process.env.NODE_ENV !== 'production') {
    const graphqlPath = yoga.graphqlEndpoint || '/graphql';
    const uiProxy = createProxyMiddleware({ target: uiTarget, changeOrigin: true, ws: true });
    // Mount the UI proxy BEFORE global helmet so CSP doesn't block Vite assets
    expressApp.use((req, res, next) => {
      const pathname = req.path || req.url;
      if (req.method !== 'GET') return next();
      if (pathname.startsWith(graphqlPath)) return next();
      if (pathname.startsWith('/verify-email')) return next();
      if (pathname.startsWith('/reset-password')) return next();
      if (pathname.startsWith('/resetPassword')) return next();
      return uiProxy(req, res, next);
    });
    // Do NOT apply global helmet here; it would add CSP headers blocking Vite dev assets.
  } else {
    // Production: enable global helmet and provide a friendly root route
    router.use(helmet());
    expressApp.get('/', (_req, res) => {
      res
        .type('text/plain')
        .send(
          'Accounts GraphQL server is running. GraphQL endpoint is at /graphql.\n' +
            'In development, use yarn dev to proxy a React UI here.'
        );
    });
  }

  // Start the server and you're done!
  const server = expressApp.listen(port, () => {
    // Pretty banner to make ports and routes obvious in dev
    const dbMode =
      process.env.MONGO_INMEMORY === '1' || process.env.MONGO_INMEMORY === 'true'
        ? 'In-memory MongoDB'
        : 'MongoDB (Docker/local)';
    const lines = [
      '────────────────────────────────────────────────────────',
      'Accounts.js - GraphQL stack (dev)',
      `Server:                 ${siteUrl}`,
      `UI (open in browser):   ${siteUrl}/`,
      `GraphiQL (open in browser): ${siteUrl}/graphql`,
      `GraphQL API endpoint:   ${siteUrl}/graphql`,
      `UI dev server:          ${uiTarget} (proxied)`,
      `Database:               ${dbMode}`,
      'Tip: Open the UI at the exact URL above. Use /graphql for GraphiQL and API requests.',
      '────────────────────────────────────────────────────────',
    ];
    console.info('\n' + lines.join('\n') + '\n');
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.info('Shutting down...');
    server.close(async () => {
      try {
        await mongoose.connection.close();
      } catch {}
      try {
        if (mongod) {
          await mongod.stop();
        }
      } catch {}
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
