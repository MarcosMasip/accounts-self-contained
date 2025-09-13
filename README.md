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

## Why this fork exists (self-contained dev UX)

This repository is a fork focused on making the Accounts.js monorepo fully self-contained and frictionless to run locally. The goals are:

- One command to start a complete stack (server + UI) with an interactive picker.
- Prefer Docker for databases; automatically fall back to in-memory MongoDB when Docker isn’t available.
- Single-port browsing in development: visit one URL (usually http://localhost:4000) for both UI and API/GraphQL.
- Clear seed/smoke flows to validate end-to-end functionality.
- Cross-platform (macOS, Windows, Linux) with minimal setup.

What changed compared to upstream:

- Added a unified dev launcher (`scripts/dev-auto.js`) used by `yarn dev` that detects Docker and falls back automatically.
- Enabled in-memory Mongo in servers, seed, and smoke tests via `mongodb-memory-server`.
- Proxied the React dev servers behind the Node servers in development so you only open one port.
- Hardened port handling and improved developer messages (friendly `/accounts` page, tips for POST endpoints).
- Updated example READMEs to point to the root flow (`yarn dev`, `yarn dev:gql`).

You can still use the Accounts.js packages as usual; this fork is about making the local dev experience seamless and self-contained.

## Quickstart (fully local, no external APIs)

Prerequisites: Node 16+, Yarn 4. Docker Desktop optional (preferred when available).

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

---

## Detailed guide for new contributors (recommended)

This section expands on the quickstart with context, expected output, and when/why to use each command.

### Prerequisites and environment

- Node: 16 or newer (LTS recommended)
- Yarn: v4 (Berry). The repo uses workspaces and `yarn install --immutable` for repeatable installs.
- Docker Desktop (optional): When running, the dev launcher will start databases via `docker compose`. If Docker isn’t available, the launcher uses in-memory MongoDB automatically.

Verify basics (optional):

```sh
node -v
yarn -v
docker --version # optional
```

### Install and compile

```sh
yarn install          # installs workspaces (may update the lockfile on the first run)
yarn install --immutable  # guarantees the install matches the lockfile
yarn compile          # compiles TypeScript across packages and examples
```

Expected output:

- A stream of workspace builds with exit code 0.
- If you see type errors, the build will fail; fix or re-run as needed.

### Start the app (single terminal)

```sh
yarn dev
```

What happens:

- You’ll be prompted to pick a stack:
  - 1 = REST (Express server + React UI)
  - 2 = GraphQL (Yoga/Apollo server + React UI)
- The launcher checks for Docker and runs `docker compose up -d` when available.
- If Docker isn’t available or fails, it sets `MONGO_INMEMORY=1` and uses mongodb-memory-server.
- Server and UI are started together; logs are labeled (REST/GRAPHQL, WEB).
- The server binds to port 4000 by default; if taken, it tries the next ports and logs the chosen one.
- In development, the server proxies the UI, so you browse a single origin.

Open your browser:

- REST: `http://localhost:4000` → UI; API at `/accounts`. Visiting `/accounts` directly shows a friendly message with info and curl examples.
- GraphQL: `http://localhost:4000` → UI; GraphQL endpoint + GraphiQL at `/graphql`.

Tips:

- Skip the prompt: `yarn dev:rest` (REST), `yarn dev:gql` (GraphQL), or `STACK=gql yarn dev`.
- If port 4000 is busy, use the port printed in the logs (e.g., 4001).

### Databases: Docker vs in-memory Mongo

- Preferred: Docker starts databases defined in `docker-compose.yml` and keeps them running between dev sessions.
- No Docker? The dev launcher uses `mongodb-memory-server` automatically. It’s ephemeral and shuts down when you stop the Node processes.
- Seed and smoke scripts detect Docker too; they run against in-memory Mongo when Docker isn’t available.

### Seed sample data

```sh
yarn seed:mongo
```

What it does:

- Populates Mongo with a demo user so you can log in immediately.
- Auto-detects Docker vs in-memory.

### Run smoke tests (end-to-end)

```sh
yarn smoke
```

What it does:

- Validates core flows (create user, login, verify email, reset password) across REST and GraphQL.
- Uses Docker if running; otherwise switches to in-memory Mongo.

### Optional dev workflows

- Run only the UI clients (useful when server already running):
  - REST UI: `yarn dev:react:rest`
  - GraphQL UI: `yarn dev:react:graphql`
- Run only the servers (two servers side-by-side):
  - `yarn dev:servers` (REST on 4001, GraphQL on 4000)

### Stopping and cleaning up

- Stop the app (server + UI): Press `Ctrl+C` where `yarn dev` is running.
- If Docker databases were started and you want to stop them too:
  ```sh
  yarn down:dbs  # runs `docker compose down -v`
  ```

Intentional behavior:

- Node processes (server/UI) stop on `Ctrl+C`.
- In-memory Mongo stops with the Node process.
- Docker containers remain up by default so you don’t lose dev data; use `yarn down:dbs` to stop/remove them when desired.

### Ports, URLs, and proxies

- Default dev origin: `http://localhost:4000`.
- REST stack: UI proxied at `/`, API under `/accounts`.
- GraphQL stack: UI proxied at `/`, GraphQL endpoint + GraphiQL at `/graphql`.
- If 4000 is busy, the server picks the next available port and logs it; use that in your browser.

### FAQs and common issues

- “Cannot GET /accounts/login” in the browser?

  - Those endpoints are POST-only. Direct browser GETs now return a helpful message with a `curl` example and a link to the UI at `/`.

- Docker not installed or not running?

  - The dev launcher falls back to in-memory Mongo automatically; functionality remains the same.

- How do I pick stacks without a prompt?

  - `yarn dev:rest`, `yarn dev:gql`, or `STACK=gql yarn dev`.

- How do I reset ports that seem stuck?

  - Stop processes with `Ctrl+C`. If a port is still bound, check with `lsof -nP -iTCP:4000 -sTCP:LISTEN` and kill the PID, or just use the next available port logged by the server.

- Where are the individual example guides?
  - Example README files under `examples/*` are streamlined and reference this root guide. Start here for the unified flow; then browse example folders for specifics.

---

## GraphQL quick walkthrough (try it now)

Once the GraphQL stack is running (pick GraphQL in `yarn dev` or run `yarn dev:gql`), open GraphiQL:

- http://localhost:4000/graphql

Run these in order. Paste each in the editor and execute; keep the Headers tab open for step 3.

1. Create a user

```
mutation CreateUser {
  createUser(
    user: { email: "john.does@john.com", password: "1234567", firstName: "John", lastName: "Doe" }
  )
}
```

2. (Optional) Verify user email

If your flow requires email verification and you have a token/userId from a real email, run:

```
mutation Verify($token: String!, $userId: ID!) {
  verifyEmail(token: $token, userId: $userId)
}
```

Most example stacks allow logging in without email verification; you can skip this step.

3. Login and copy the accessToken

```
mutation Login {
  authenticate(
    serviceName: "password"
    params: { password: "1234567", user: { email: "john.does@john.com" } }
  ) {
    tokens { accessToken }
  }
}
```

In GraphiQL, click Headers and set:

```
{
  "Authorization": "Bearer <paste accessToken here>"
}
```

4. Query protected and public fields

```
query MeAndFields {
  me { id emails { address verified } }
  privateField
  publicField
}
```

You should see `me` populated, `privateField` accessible (requires the token), and `publicField` always available.

---

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
