# react-graphql-typescript

This example demonstrates how to use [accounts-js](https://github.com/accounts-js/accounts) with React and GraphQL.

## Recommended: start from the repo root

From the repository root, use the unified dev command which launches both the GraphQL server and this React app in a single terminal:

- Install deps and compile: `yarn install && yarn install --immutable && yarn compile`
- Start GraphQL stack (server + UI): `yarn dev:gql`

Then open [http://localhost:4000](http://localhost:4000). The server proxies this React app, so you can use a single origin (GraphQL endpoint and GraphiQL are at `/graphql`).

## Optional: run this UI standalone

If you prefer to run only the UI from this folder:

```bash
yarn dev
```

This starts Vite on port 3000. Make sure the GraphQL server is running on port 4000 so API requests succeed.
