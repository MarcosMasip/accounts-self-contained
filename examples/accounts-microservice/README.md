# accounts-boost examples

Includes two examples of using `@accounts/boost`.

## Setup

From the repository root:

- Install deps and compile: `yarn install && yarn install --immutable && yarn compile`

Start supporting databases if you want Docker-managed services:

```bash
yarn dev:dbs
```

Then run one of the variants from this folder:

- `yarn run start:mono` – Starts a GraphQL server which consumes the `@accounts/boost` typeDefs and resolvers when building your app's schema.
- `yarn run start:micro` – Starts `@accounts/boost` as a GraphQL microservice which is then stitched with your app's schema.
