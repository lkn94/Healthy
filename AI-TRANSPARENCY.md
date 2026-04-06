# AI & Practice Transparency

This repository was created as a personal learning exercise and the entire code base (backend, frontend, docs, and supporting assets) was produced with the help of AI tooling. No human software engineer wrote the initial implementation manually; my role was to provide the prompts, review the results, and run the generated code.

## Why this matters

- **Experimental project** – Healthy is not a commercial product and should be treated as a playground for experimenting with Home Assistant integrations, Fastify/Prisma, and Vue/Tailwind UI concepts.
- **AI-generated code** – Every file started as an AI output. While I review the changes before committing, there may still be rough edges, missing edge-case handling, or architectural shortcuts typical for prototypes.
- **No production guarantees** – Security, performance, and data accuracy have not been audited. If you plan to deploy this project, you do so entirely at your own risk and should perform an in-depth review first.

## What you should do as a user

1. **Audit the repository** – Read the code, run the tests/builds yourself, and verify that the behavior matches your expectations.
2. **Harden before production** – Configure proper secrets management, TLS termination, monitoring, and backups if you expose the app to the public internet.
3. **Contribute fixes** – Issues or pull requests that harden the project are welcome. Please describe what you verified manually, since automated tests are limited.

## Attribution

- Generated with OpenAI’s coding assistants (ChatGPT / GPT-5 series) acting as the primary author.
- Human oversight limited to prompting, reviewing diffs, executing commands, and merging results.

By keeping this note in the repository and linking it from the README files, I want to be transparent about the origin of the code and set the right expectations for anyone exploring or forking Healthy.
