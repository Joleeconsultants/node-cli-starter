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
- GitHub Actions artifact and tagged-release automation

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

## GitHub Actions releases

The `Build Windows executable` workflow supports both future development and releases:

- Open or update a pull request to verify that the source, tests, and Windows build all succeed.
- Run it manually from the repository's **Actions** tab to build and download a workflow artifact.
- Push a version tag such as `v0.1.0` to build the executable, retain it as an artifact, create a GitHub release, and attach the `.exe`.

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow needs the standard GitHub-provided `GITHUB_TOKEN`; no custom secret is required. Its permission is limited to writing release contents.

## Adapt it

Before using the template for a new project:

1. Rename `node-cli-starter` in `package.json`, `bin/cli.js`, the build workflow, and this README.
2. Replace the example `greet` command with the project's commands.
3. Keep the version in `package.json` and `bin/cli.js` synchronized.
4. Run `npm test` and `npm run build:win`, then smoke-test the generated executable.
5. Tag the commit only after the version and executable name are correct.
