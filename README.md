<p align="center">
  <a href="https://www.accountsjs.com">
    <img alt="accounts-js logo" src="https://github.com/accounts-js/accounts/blob/master/website/static/img/logo.png?raw=true" width="500">
  </a>
</p>

<br>

<p align="center">
  <a href="https://www.npmjs.com/package/@accounts/server">
   <img alt="npm" src="https://img.shields.io/npm/v/@accounts/server">
  </a>
  <a href="https://www.npmjs.com/package/@accounts/server">
   <img alt="npm downloads" src="https://img.shields.io/npm/dm/@accounts/server">
  </a>
  <a href="https://codecov.io/gh/accounts-js/accounts">
   <img alt="codecov" src="https://img.shields.io/codecov/c/github/accounts-js/accounts">
  </a>
  <a href="https://github.com/accounts-js/accounts/blob/master/LICENSE">
   <img alt="License" src="https://img.shields.io/github/license/accounts-js/accounts">
  </a>
</p>

<h3 align="center">
  Fullstack authentication and accounts-management for GraphQL and REST.
</h3>

<br>

_Note: Although accounts-js is production ready, the packages within this repo are under active development — expect breaking changes with minor version updates._

The `@accounts` suite of packages aims to provide all the tools you need to build a **flexible authentication and accounts management** solution for your application.

🔐 We got you covered! The packages come with **strong opinionated security** defaults while preserving options for configuration.

📚 Ready to get started? Take a look at our [documentation](https://www.accountsjs.com/docs/introduction) to learn how to use the packages. For more advanced usage, head to our [API documentation](https://www.accountsjs.com/docs/api/server/index).

🙋‍♀️ A bit lost? Here are some [examples](https://github.com/accounts-js/accounts/tree/master/examples) where you can see working clients and severs with react, GraphQL or Rest.

## Quickstart (fully local, no external APIs)

Prerequisites: Node 16+, Yarn 4, Docker Desktop running.

1. Install deps and compile all workspaces

- First install (updates lockfile if needed): `yarn install`
- Then enforce immutable installs: `yarn install --immutable`
- Compile once: `yarn compile`

2. Start the app (Docker preferred, auto-fallback to no-Docker)

- Single command, interactive picker: `yarn dev` → choose REST or GraphQL.
- Or skip the prompt: `yarn dev` (REST) / `yarn dev:gql` (GraphQL) / `yarn dev:rest`.
- You can also set `STACK=gql yarn dev` to preselect GraphQL.
- The launcher attempts to start Docker containers when available; if Docker isn't available or fails, it falls back to in-memory MongoDB automatically.

3. Seed a demo user into Mongo (optional)

- `yarn seed:mongo`

4. What gets started

- REST stack (from picker or `yarn dev:rest`):
  - REST API server with in-memory or Docker Mongo.
  - React UI dev server.
  - Single-port browsing: visit http://localhost:4000 (or the port logged by the server if 4000 is busy). The UI is proxied behind the same origin; the API is under `/accounts`.
- GraphQL stack (from picker or `STACK=gql yarn dev` or `yarn dev:gql`):
  - GraphQL Yoga server with in-memory or Docker Mongo.
  - React GraphQL UI dev server.
  - Single-port browsing: visit http://localhost:4000 (GraphiQL at `/graphql`). The React UI is proxied behind the same origin.

5. Run a matching React client (optional)

- REST client: `yarn dev:react:rest`
- GraphQL client: `yarn dev:react:graphql`

6. Smoke test the whole stack
   - `yarn smoke`
   - If Docker is running, containers are used. If not, the test automatically switches to in-memory Mongo. It runs end-to-end flows (create user, login, verify email, reset password) against REST and GraphQL, then tears down containers when used.

### Notes on Docker vs no-Docker

- The dev launcher prefers Docker if available to start Mongo/Postgres/Redis (as defined in `docker-compose.yml`).
- If Docker isn't installed or running, it automatically runs servers with in-memory Mongo so you can still interact with all features locally.
- You can still run seed/smoke explicitly; they also auto-detect Docker and fall back to in-memory.

Troubleshooting (macOS): Ensure Docker Desktop is running. If ports 27017/5432/6379 are in use, stop other services or edit `docker-compose.yml`.

## Features

- Create and manage users
- Create and manage sessions (JWT)
- Pick your transport layer
  - GraphQL
  - Rest
- Compatible with all the modern js frameworks (react, react-native, vue, angular...)
- Use the database you want
  - Mongo
  - Typeorm
  - MikroORM
  - Redis (sessions only)
- Add all the strategies you need
  - password
  - magic link
  - Oauth (WIP)

## Contributing and community

Any contribution is very welcome, read our [contributing guide](CONTRIBUTING.md) to see how to locally setup the repository and see our development process.

If you have any question you can also join our Discord server: https://discord.gg/nYSyrWPPdu

[![Discord](https://github.com/darkbasic/accounts/assets/1047358/683b86e4-4553-4d5b-a338-089be4936f2e)](https://discord.gg/nYSyrWPPdu)

## Sponsors

- Contribute via [Open Collective](https://opencollective.com/accounts-js)

### Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website.

<a href="https://github.com/accounts-js/accounts/graphs/contributors"><img src="https://opencollective.com/accounts-js/sponsors.svg?width=890" /></a>

### Backers

Thank you to all our backers! 🙏

<a href="https://opencollective.com/accounts-js#backers" target="_blank"><img src="https://opencollective.com/accounts-js/backers.svg?width=890" /></a>

### Contributors

This project exists thanks to all the amazing people who contribute.

<a href="https://github.com/accounts-js/accounts/graphs/contributors"><img src="https://opencollective.com/accounts-js/contributors.svg?width=890" /></a>
