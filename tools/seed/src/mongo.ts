import 'reflect-metadata';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AccountsServer } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import { Mongo } from '@accounts/mongo';
import type { User } from '@accounts/types';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/accounts-js-seed';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@example.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'changeme';

const convertUrlToToken = (url: string): string => {
  const split = url.split('/');
  return split[split.length - 1];
};

async function main() {
  (mongoose as any).Promise = global.Promise;
  const useMemory = process.env.MONGO_INMEMORY === '1';
  let mongoServer: MongoMemoryServer | undefined;
  if (useMemory) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  } else {
    await mongoose.connect(MONGO_URL);
  }

  const db = mongoose.connection;
  const accountsDb = new Mongo(db);

  const emails: any[] = [];
  const accountsPassword = new AccountsPassword();
  const accountsServer = new AccountsServer(
    {
      tokenSecret: 'local-seed-secret',
      emailTemplates: {
        from: 'accounts-js <no-reply@accounts-js.com>',
        verifyEmail: {
          subject: () => 'Verify your account email',
          text: (user: User, url: string) => convertUrlToToken(url),
        },
        resetPassword: {
          subject: () => 'Reset your password',
          text: (user: User, url: string) => convertUrlToToken(url),
        },
        enrollAccount: {
          subject: () => 'Set your password',
          text: (user: User, url: string) => convertUrlToToken(url),
        },
        passwordChanged: {
          subject: () => 'Your password has been changed',
          text: () => `Your account password has been successfully changed`,
          html: () => `Your account password has been successfully changed.`,
        },
        magicLink: {
          subject: () => 'Your magic link',
          text: (user: User, url: string) => convertUrlToToken(url),
        },
      },
      sendMail: async (mail) => {
        emails.push(mail);
      },
    },
    {
      password: accountsPassword,
    },
    accountsDb
  );

  // drop db for a clean seed
  await db.dropDatabase();

  console.log(`Seeding demo user: ${DEMO_EMAIL}`);
  const userId: string = await accountsPassword.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    profile: { firstName: 'Demo', lastName: 'User' },
  } as any);

  // simulate verify email by requesting token and verifying
  await accountsPassword.sendVerificationEmail(DEMO_EMAIL);
  const token = emails[0]?.text;
  if (token) {
    await accountsPassword.verifyEmail(token);
  }

  console.log('Seed complete:');
  console.log(`  email: ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  userId: ${userId}`);

  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
