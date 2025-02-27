# CLAUDE.md - @tscircuit/soup-util

## Build & Test Commands
- Build: `npm run build` (tsup-node ./index.ts --format esm --dts --sourcemap)
- Test all: `bun test`
- Test single file: `bun test tests/file-name.test.ts`
- Lint: `npx @biomejs/biome lint .`
- Format: `npx @biomejs/biome format . --write`

## Code Style
- **TypeScript**: Strict mode enabled with ES2022 target
- **Formatting**: Biome with 2-space indentation
- **File naming**: Kebab-case for filenames (enforced by Biome)
- **Imports**: Use explicit imports, organized with Biome
- **Semicolons**: Optional (asNeeded in Biome config)
- **Types**: Use strict typing; avoid `any` when possible
- **Error handling**: Use explicit error messages with specific details
- **ID conventions**: Elements use type-based ID format: `${type}_${index}`

## Utility Functions
Follow the `su(soup).element_type.operation()` pattern as demonstrated in README examples.
Maintain type safety through generics and proper return types.