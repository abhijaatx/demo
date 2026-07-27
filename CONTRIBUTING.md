# Contributing

## Local quality checks

```bash
npm install
npm run format
npm run lint
npm run check:boundaries
npm run typecheck
npm test
```

`npm run verify` runs formatting checks, ESLint, workspace-boundary checks, and TypeScript typechecking. Run `npm run format` only on intentional source/config changes; product planning documents are not part of the source-format command.

## Commit convention

Use Conventional Commits:

```text
<type>(<optional scope>): <imperative summary>
```

Allowed types are `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `security`, and `test`.

Examples:

- `feat(editor): add step reordering`
- `fix(player): preserve focus after navigation`
- `security(upload): reject mismatched file signatures`

Keep commits focused and explain security, migration, or operational impact in the body when applicable. Validate a commit message with:

```bash
npm run check:commit -- .git/COMMIT_EDITMSG
```

## Pull-request expectations

- Link the roadmap task.
- Describe user-visible and operational changes.
- Include tests and exact commands run.
- Include screenshots or visual-regression output for UI changes.
- Include migration, rollback, and monitoring notes when applicable.
- Complete the Claude security handoff required by `AGENTS.md`.
