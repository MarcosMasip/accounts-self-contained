# mikro-orm-server-typescript

This example demonstrates how to use [accounts-js](https://github.com/accounts-js/accounts) with PostgreSQL via the [@accounts/mikro-orm](https://www.npmjs.com/package/@accounts/mikro-orm) adapter.

## Setup

From the repository root:

- Install deps and compile: `yarn install && yarn install --immutable && yarn compile`

## Prerequisites (PostgreSQL)

Start Postgres via Docker:

```bash
yarn dev:dbs   # starts postgres (and other DBs) via docker compose
```

or configure `.env` in this folder to point to your local Postgres.

## Run the server

From the repository root:

```bash
yarn workspace @examples/graphql-mikro-orm-typescript start
```

Then open:

- GraphQL endpoint/GraphiQL: http://localhost:4000/graphql

Tip: If you also want a React UI, the standard GraphQL stack (`yarn dev:gql`) starts the Mongo-based example with the UI proxied at http://localhost:4000.

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
