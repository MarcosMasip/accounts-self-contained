# graphql-server-typescript-apollo

This example demonstrate how to use [accounts-js](https://github.com/accounts-js/accounts).

## Setup example

From the repository root:

- Install dependencies: `yarn install && yarn install --immutable`
- Compile once: `yarn compile`
- Start the GraphQL stack (Apollo server + React UI): `yarn dev:gql`

## Prerequisites

None. The unified dev command will attempt to start MongoDB via Docker; if Docker isn't available, the server falls back to mongodb-memory-server automatically.

## Getting Started

When started from the root (`yarn dev:gql`), visit http://localhost:4000/ for the React UI. The GraphQL endpoint is at http://localhost:4000/graphql. The server proxies the UI so you only need one port.

```graphql
mutation CreateUser {
  createUser(
    user: { email: "john.does@john.com", password: "1234567", firstName: "John", lastName: "Doe" }
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
