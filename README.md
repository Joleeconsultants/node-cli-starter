# Node CLI starter

A small, dependency-free command-line application kept as a starting point for a future project.

The original service-specific upload, encryption, API, environment, packaging, and release code has been removed. What remains demonstrates the reusable CLI structure:

- executable registration through `package.json`
- command dispatch
- positional arguments and flags
- help and version output
- human-readable, quiet, and JSON output modes
- errors on stderr with a non-zero exit code

## Try it

Requires Node.js 18 or newer.

```bash
npm link
cli-starter --help
cli-starter greet Ada
cli-starter greet Ada --json
```

You can also run it without linking:

```bash
node bin/cli.js greet Ada
```

## Adapt it

Rename `cli-starter` in `package.json` and `bin/cli.js`, then replace the example `greet` command with commands for the future project.
