# Expo CLI

A professional AI programming assistant CLI that unifies architectures from Claude Code and OpenCode into a single coherent, extensible product.

## Features

- Conversational runtime core with interactive REPL and headless modes
- Hierarchical agent system (Primary, Subagent, Hidden agents)
- Extensible tool framework with built-in and custom tools
- Granular permission system (allow/ask/deny with modes)
- Lifecycle hooks system
- Skills and slash commands
- Plugin system with marketplace support
- MCP (Model Context Protocol) integration
- LSP (Language Server Protocol) integration
- Push notification channels
- First-class observability (OpenTelemetry)
- Cross-platform support (Windows, macOS, Linux)
- Internationalization (en, es)

## Tech Stack

- **Runtime**: Bun 1.0+ (primary), Node.js 20+ (fallback)
- **Language**: TypeScript 5.x strict
- **Monorepo**: pnpm workspaces
- **Validation**: Zod
- **Storage**: SQLite + JSONL append-only
- **Telemetry**: OpenTelemetry SDK
- **i18n**: i18next pattern

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm test
```

## Packages

| Package | Purpose |
|---------|---------|
| `@expo/core` | EventBus, errors, logger, condition parser, ID generators |
| `@expo/sdk` | Public API: `tool()`, `agent()`, `hook()` builders |
| `@expo/storage` | SQLite index + JSONL append-only session logs |
| `@expo/config` | Multi-scope settings, deep merge, `.well-known` discovery |
| `@expo/cli` | Flag parsing, headless mode, REPL, slash commands, skills |
| `@expo/agents` | Registry, runner with step limits, session orchestrator |
| `@expo/tools` | Registry, executor with timeout/abort/permissions, 8 built-in tools |
| `@expo/permissions` | Rule parser with glob matching, evaluator, modes |
| `@expo/hooks` | Engine with matcher, dispatch, timeout, 5 handler types |
| `@expo/memory` | Loader, @-include expansion, conditional path-glob blocks |
| `@expo/plugins` | Manifest validation, resolver, installer, loader, marketplace |
| `@expo/secrets` | Encrypted file store with per-installation random key |
| `@expo/mcp` | Client pool, stdio/HTTP/SSE transports, OAuth, tool registration |
| `@expo/lsp` | Client pool, 21 language configs, diagnostics, document sync |
| `@expo/channels` | Router, sender allowlist, permission relay |
| `@expo/telemetry` | Tracer, spans with typed attributes, OTLP exporter |
| `@expo/sandbox` | FS/network/process guards |
| `@expo/tui` | Renderer, themes, status line, markdown output |
| `@expo/ide-protocol` | JSON-RPC server for editor integrations |
| `@expo/i18n` | Translator with interpolation, pluralization |
| `@expo/update` | Version checker, self-updater, channel resolution |

## License

MIT
