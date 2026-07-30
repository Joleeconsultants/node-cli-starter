# Cross-platform and container testing roadmap

This document records the intended testing path for the CLI template. It contains no environment-specific names, credentials, runner addresses, or other private infrastructure details.

## Current foundation

- Keep the Node.js CLI runnable on Windows, Linux, and macOS with Node.js 18 or newer.
- Build and smoke-test the standalone Windows executable in GitHub Actions.
- Retain successful executables as workflow artifacts for manual review and release upload.
- Use Dependabot only for GitHub Actions dependencies.

## Phase 1: hosted Linux testing

Add an `ubuntu-latest` job that runs on pull requests and changes to the default branch:

1. Check out the repository.
2. Set up the supported Node.js version.
3. Install dependencies with `npm ci`.
4. Run syntax checks and automated tests.
5. Run representative CLI smoke tests.

This verifies Linux compatibility without requiring a container or self-hosted infrastructure.

Completion criteria:

- The same CLI behavior tests pass on Windows and Linux.
- Platform-specific path and shell assumptions are covered by tests.
- Failures on either operating system block merging.

## Phase 2: reviewed Dockerfile

Create a `Dockerfile` as normal, reviewed source code. GitHub Actions should build and test it, not generate or rewrite it automatically.

Recommended starting properties:

- Use an official, maintained Node.js base image.
- Pin the Node.js major version and deliberately review image updates.
- Use a small runtime image when the future application permits it.
- Run as a non-root user.
- Copy dependency manifests before application files for efficient build caching.
- Install production dependencies with a reproducible command.
- Provide a predictable CLI entry point.
- Add a `.dockerignore` that excludes Git metadata, local dependencies, logs, build output, and secrets.
- Never bake credentials or environment files into the image.

Completion criteria:

- `docker build` succeeds from a clean checkout.
- The image runs `--help`, `--version`, and representative commands successfully.
- The container exits with the expected status for invalid input.
- A vulnerability scan reports no unresolved critical findings.

## Phase 3: hosted container checks

Extend GitHub Actions on `ubuntu-latest` to:

1. Build the Docker image without publishing it.
2. Run CLI smoke tests inside the image.
3. Scan the resulting image.
4. Keep build logs for diagnosis while avoiding image publication.

Publishing to a container registry should remain a separate, explicitly approved workflow.

## Phase 4: optional self-hosted runner

Use a self-hosted runner only when hosted runners cannot satisfy a concrete requirement, such as private network access, specialized hardware, or environment-specific integration tests.

Before enabling it:

- Assign a dedicated runner label and target only that label.
- Keep the runner isolated from unrelated systems and secrets.
- Prefer ephemeral jobs or reset the workspace between jobs.
- Do not run untrusted fork pull requests on the runner.
- Grant the workflow and runner account only the permissions required for testing.
- Set job timeouts and container resource limits.
- Keep publishing and deployment separate from test jobs.

Completion criteria:

- A documented test requires the self-hosted environment.
- Runner labels, permissions, cleanup, and offline behavior are tested.
- Hosted tests remain the first line of validation.

## Recommended order

1. Add hosted Linux tests.
2. Expand automated CLI behavior tests.
3. Add and review the Dockerfile and `.dockerignore`.
4. Add hosted container build, smoke-test, and scan jobs.
5. Introduce a self-hosted runner only for a demonstrated need.
6. Add publishing workflows separately when a release destination is chosen.
