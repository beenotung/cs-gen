# cs-gen: Command Sourcing Project Generator

> Project template with code generation setup for rapid development using Command Sourcing design pattern.

Inspired from CQRS (Command Query Responsibility Segregation) and ES (Event Sourcing) but simplified to allow less boilerplate.

Think it like the reducer in redux, but compatible to OOP (Object-oriented programming).

**This is not a framework**, instead it's a code generation tool to reduce the burden of boilerplate for common tasks in the development of web server and backend system with Typescript.

Any required library are injected to the target project, hence the resulting project does not have runtime dependency on this package.

This toolkit has been used in production by 30+ projects and micro-services since 2019.
The rough edges are getting polished and patched overtime hence it is considered to be "production-ready" for small to middle scale of application.

It has gone through 2 years of __active development__.

## System Architecture

Details analysis can be found in https://github.com/beenotung/cqrs-documents

### Background: The typical architecture
Typical applications follows 3-tier web architecture
which consists of the presentation tier, logic tier, and data tier.
Namely, the web/app client, web server, and database (usually RDBMs or NoSQL Database).

The business logic is usually handled by the domain model on the web server and validation constraints in the RDBMs.

The web server usually implements the domain model using Object-Oriented-Programming (OOP)
while the database usually model the dataset in normalized format.

### The Problem with typical architecture

Database is optimized for writing
but typical application area read-heavy.
Usually over 90% traffics are read nature.
reference: [1% rule (Internet culture)](https://en.wikipedia.org/wiki/1%25_rule_(Internet_culture))

### Solution: A simplified architecture

## Features

- Model API calls as command, query, and subscription (live query)
- Auto store API calls
- Auto replay API calls when server restart
- Customize which API calls to be stored and replayed
- Auto reconnect when network restore from failure
- Auto setup package dependencies and formatting (tsconfig, tslint, prettier, npm scripts, e.t.c.)

## Usage Example

You can create a project based on the template using `npm init`. For example:

```bash
npm init cs my-package-name
```

or

```bash
npx create-cs my-package-name
```

A project will be created in the my-package-name directory (folder).

Details refers to [./create-cs/readme.md](./create-cs/readme.md)

## Supported Template

Currently there is only one template.

The template project is configured to generate Typescript source code from APIs defined in `config/call-meta.ts` using tsc-macro.

The API calls are stored in a sqlite database and replayed when the server restarts.

You can specify on each type of API whether it should be replayed or skipped when the server restart.

## License
This is free and open-source software (FOSS) with
[BSD-2-Clause License](./LICENSE)
