# react-rest-typescript

This example demonstrate how to use [accounts-js](https://github.com/accounts-js/accounts) with React and REST.

In this repo, you don't need to manually start the REST server. The root dev command launches both the REST API and this React app together, preferring Docker for MongoDB and falling back to in-memory Mongo automatically.

## Setup example

From the repository root:

- Install dependencies: `yarn install && yarn install --immutable`
- Compile once: `yarn compile`
- Start the REST stack (server + this UI): `yarn dev`

## Getting Started

Once started, open [http://localhost:4000](http://localhost:4000). The REST server proxies this React app, so you can use a single port for both UI and API (API is under `/accounts`).

Tip: If you prefer to run only this UI locally, you can still `yarn dev` in this folder which starts Vite on port 3000. In that case, make sure the REST server is running on port 4000 so API calls to `/accounts` succeed.
