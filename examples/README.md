# Accounts-js examples

This folder provides examples on how to use the [accounts-js](https://github.com/accounts-js/accounts) packages.

Most newcomers should start from the root quickstart and unified dev flow:

- From repo root: `yarn install && yarn install --immutable && yarn compile`
- Start a full stack: `yarn dev` (REST) or `yarn dev:gql` (GraphQL). The server proxies the React UI so you browse a single origin at http://localhost:4000.

## Examples

REST Server + REST client example:

- Server: [rest-express-typescript](./rest-express-typescript)
- Client: [react-rest-typescript](./react-rest-typescript)

GraphQL Server + GraphQL Client example:

- Server: [graphql-server-typescript](./graphql-server-typescript)
- Client: [react-graphql-typescript](./react-graphql-typescript)

Other examples:

- Accounts Boost [accounts-boost](./accounts-boost)
- Typeorm + PostgreSQL example [graphql-server-typeorm-postgres](./graphql-server-typeorm-postgres)
