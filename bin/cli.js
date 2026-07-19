#!/usr/bin/env node

import process from 'node:process'

const metadata = {
  name: 'node-cli-starter',
  version: '0.1.0',
}

function printHelp() {
  process.stdout.write(`${metadata.name} — a minimal Node.js CLI starter

Usage:
  node-cli-starter greet [name] [options]

Options:
      --json     Print machine-readable JSON
  -q, --quiet    Print only the greeting
  -v, --version  Show the CLI version
  -h, --help     Show this help

Examples:
  node-cli-starter greet
  node-cli-starter greet Ada
  node-cli-starter greet Ada --json
`)
}

function parseArgs(argv) {
  const positional = []
  const options = { json: false, quiet: false, help: false }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--json') options.json = true
    else if (arg === '--quiet' || arg === '-q') options.quiet = true
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else positional.push(arg)
  }

  return { positional, options }
}

function runGreet(name = 'world', options) {
  const result = { greeting: `Hello, ${name}!`, name }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } else if (options.quiet) {
    process.stdout.write(`${result.greeting}\n`)
  } else {
    process.stdout.write(`Greeting: ${result.greeting}\n`)
  }
}

function main() {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === '--version' || command === '-v') {
    process.stdout.write(`${metadata.version}\n`)
    return
  }

  if (command !== 'greet') throw new Error(`Unknown command: ${command}`)

  const { positional, options } = parseArgs(rest)
  if (options.help) {
    printHelp()
    return
  }

  if (positional.length > 1) throw new Error('Usage: node-cli-starter greet [name]')
  runGreet(positional[0], options)
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error.message || 'Command failed.'}\n`)
  process.exitCode = 1
}
