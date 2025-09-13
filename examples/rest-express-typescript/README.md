# rest-express-typescript

This example demonstrate how to use [accounts-js](https://github.com/accounts-js/accounts).
In this repo, you don't need to pre-run Mongo: the root dev command starts Docker DBs when available and falls back to in-memory Mongo otherwise.

## Setup example

In order to be able to run this example on your machine you first need to do the following steps:

- From the repo root:
  - `yarn install && yarn install --immutable`
  - `yarn compile`
  - `yarn dev`

## Getting Started

When the REST stack starts from the root (`yarn dev`), open [http://localhost:4000](http://localhost:4000) for both UI and API (API under `/accounts`).
