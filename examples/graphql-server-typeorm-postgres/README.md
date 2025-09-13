# typeorm-server-typescript

This example demonstrates how to use [accounts-js](https://github.com/accounts-js/accounts) with PostgreSQL via the [@accounts/typeorm](https://www.npmjs.com/package/@accounts/typeorm) adapter.

## Setup

From the repository root:

- Install deps and compile: `yarn install && yarn install --immutable && yarn compile`

## Prerequisites (PostgreSQL)

You need a PostgreSQL instance. Easiest is via Docker:

```bash
yarn dev:dbs   # starts postgres (and other DBs) via docker compose
```

Alternatively, edit `.env` in this folder to match your local Postgres and ensure it’s running. The server reads `DATABASE_URL` and `ACCOUNTS_SECRET` from `.env`.

## Run the server

From the repository root:

```bash
yarn workspace @examples/graphql-typeorm-typescript start
```

Then open:

- GraphQL endpoint/GraphiQL: http://localhost:4000/graphql

Tip: If you also want a React UI, use the standard GraphQL stack instead (`yarn dev:gql`), which starts the Mongo-based example with the UI proxied at http://localhost:4000.

```graphql
mutation CreateUser {
  createUser(
    user: {
      email: "john.does@john.com"
      password: "1234567"
      profile: { firstName: "John", lastName: "Doe" }
    }
  )
}

mutation Auth {
  authenticate(
    serviceName: "password"
    params: { password: "1234567", user: { email: "john.does@john.com" } }
  ) {
    tokens {
      accessToken
    }
  }
}

query Test {
  privateField
}
```
