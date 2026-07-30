# node-cli-starter

A minimal, dependency-free Node.js command-line starter kept as a foundation for future projects.

The original service-specific upload, encryption, API, environment, packaging, and release code has been removed. What remains demonstrates the reusable CLI structure:

- executable registration through `package.json`
- command dispatch
- positional arguments and flags
- help and version output
- human-readable, quiet, and JSON output modes
- errors on stderr with a non-zero exit code
- a standalone Windows `.exe` build
- GitHub Actions build and artifact automation

## Try it

Requires Node.js 18 or newer.

```bash
npm link
node-cli-starter --help
node-cli-starter greet Ada
node-cli-starter greet Ada --json
```

You can also run it without linking:

```bash
node bin/cli.js greet Ada
```

## Build a Windows executable

Install dependencies and run the Windows build:

```bash
npm ci
npm run build:win
```

The executable is written to `dist/node-cli-starter.exe`. It contains the Node.js runtime, so the destination computer does not need Node.js installed.

Test it on Windows:

```powershell
.\dist\node-cli-starter.exe --version
.\dist\node-cli-starter.exe greet Ada
```

## GitHub Actions builds

The `Build Windows executable` workflow supports future development without publishing anything automatically:

- Open or update a pull request to verify that the source, tests, and Windows build all succeed.
- Run it manually from the repository's **Actions** tab to build and download a workflow artifact.
- Builds on `master` also retain the executable as a downloadable workflow artifact.

The workflow uses only GitHub-maintained Actions, has read-only repository permissions, and requires no custom secrets. It never creates a release or uploads a public release asset.

When a future version is ready, download `node-cli-starter-windows-x64` from the completed workflow run, create the GitHub release manually, and upload the contained `.exe` yourself.

Dependabot checks the workflow's GitHub Actions every Monday and groups available updates into one pull request. It is intentionally limited to the `github-actions` ecosystem and does not open npm dependency updates.

See [ROADMAP.md](ROADMAP.md) for the planned Linux, container, and optional self-hosted runner testing stages.

## Adapt it

Before using the template for a new project:

1. Rename `node-cli-starter` in `package.json`, `bin/cli.js`, the build workflow, and this README.
2. Replace the example `greet` command with the project's commands.
3. Keep the version in `package.json` and `bin/cli.js` synchronized.
4. Run `npm test` and `npm run build:win`, then smoke-test the generated executable.
5. Create the release and upload the verified executable manually.
