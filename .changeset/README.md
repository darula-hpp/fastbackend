# FastBackend Changesets

Use changesets to version and publish `@fastbackend/core` and `@fastbackend/cli` together (fixed group in `config.json`).

```bash
# 1. Describe your change
pnpm changeset

# 2. Apply version bumps and changelogs (use pnpm run version, not pnpm version)
pnpm run version

# 3. Build and publish to npm
pnpm release

# If npm 2FA is enabled, pass a one-time password:
pnpm release -- --otp=123456
```
