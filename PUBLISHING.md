# Publishing Guide

This guide explains how to publish the uplnk packages to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **npm CLI**: Ensure npm is installed (comes with Node.js)
3. **Access Rights**: You need publish access to the `@uplnk` scope

## First-Time Setup

### 1. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 2. Verify Login

```bash
npm whoami
```

Should display your npm username.

### 3. Create Organization (if needed)

If the `@uplnk` scope doesn't exist:
1. Go to [npmjs.com](https://www.npmjs.com)
2. Click your profile → "Add Organization"
3. Create organization named "uplnk"
4. Set it to "Public" (free)

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass: `pnpm run test`
- [ ] Build succeeds: `pnpm run build`
- [ ] Linting passes: `pnpm run lint`
- [ ] Formatting is correct: `pnpm run format:check`
- [ ] Version numbers are updated in both packages
- [ ] CHANGELOG.md is updated
- [ ] Git working directory is clean
- [ ] On `main` branch with latest changes

## Publishing Process

### Option 1: Publish All Packages (Recommended)

```bash
# 1. Clean and build
pnpm run build

# 2. Run all checks
pnpm run test
pnpm run lint
pnpm run format:check

# 3. Publish types first (core depends on it)
pnpm --filter @uplnk/types publish

# 4. Publish core
pnpm --filter @uplnk/core publish

# Or use the convenience script:
pnpm run publish:all
```

### Option 2: Publish Individual Packages

**Publish @uplnk/types:**
```bash
cd packages/types
npm publish --access public
```

**Publish @uplnk/core:**
```bash
cd packages/core
npm publish --access public
```

## Version Management

### Semantic Versioning

We follow [SemVer](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes

### Updating Versions

**For patch release (0.1.0 → 0.1.1):**
```bash
cd packages/types
npm version patch

cd ../core
npm version patch
```

**For minor release (0.1.0 → 0.2.0):**
```bash
cd packages/types
npm version minor

cd ../core
npm version minor
```

**For major release (0.1.0 → 1.0.0):**
```bash
cd packages/types
npm version major

cd ../core
npm version major
```

### Manual Version Update

Alternatively, manually edit `package.json` in both packages:

```json
{
  "version": "0.2.0"
}
```

**Important:** When updating `@uplnk/core`, also update the dependency version:
```json
{
  "dependencies": {
    "@uplnk/types": "^0.2.0"
  }
}
```

## Post-Publishing

### 1. Verify Publication

Check packages on npm:
- https://www.npmjs.com/package/@uplnk/types
- https://www.npmjs.com/package/@uplnk/core

### 2. Test Installation

```bash
# In a test directory
npm install @uplnk/core

# Verify it works
node -e "console.log(require('@uplnk/core'))"
```

### 3. Tag and Push

```bash
# Create git tag
git tag v0.1.0

# Push tag
git push origin v0.1.0

# Push changes
git push origin main
```

### 4. Create GitHub Release

1. Go to https://github.com/a-saed/uplnk/releases
2. Click "Draft a new release"
3. Select the tag you just created
4. Add release notes (copy from CHANGELOG.md)
5. Publish release

## Troubleshooting

### "You do not have permission to publish"

Solution: Package name might be taken or you need access.
```bash
# Check if package exists
npm view @uplnk/core

# If it doesn't exist, the scope might be restricted
# Use: npm publish --access public
```

### "workspace:* dependency" Error

Solution: The workspace protocol must be converted before publishing.

**For @uplnk/core**, change in `package.json`:
```json
// Before
"dependencies": {
  "@uplnk/types": "workspace:*"
}

// After
"dependencies": {
  "@uplnk/types": "^0.1.0"
}
```

We've already fixed this in the package.json files.

### "package.json is missing"

Solution: Make sure you're in the correct package directory or use filters:
```bash
pnpm --filter @uplnk/core publish
```

### Build Artifacts Missing

Solution: Build before publishing:
```bash
pnpm run build
```

### Two-Factor Authentication (2FA)

If you have 2FA enabled on npm:
1. You'll be prompted for an OTP (One-Time Password)
2. Get the code from your authenticator app
3. Enter it when prompted

## Automated Publishing (Future)

Consider setting up automated publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm run test
      - run: pnpm --filter @uplnk/types publish
      - run: pnpm --filter @uplnk/core publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To use this:
1. Create an npm access token at https://www.npmjs.com/settings/tokens
2. Add it as `NPM_TOKEN` in GitHub repository secrets
3. Create a GitHub release to trigger publishing

## Release Checklist Template

```markdown
## Release v0.1.0

- [ ] Update CHANGELOG.md
- [ ] Update version in packages/types/package.json
- [ ] Update version in packages/core/package.json
- [ ] Update @uplnk/types dependency version in core
- [ ] Commit version bumps: `git commit -am "chore: bump version to 0.1.0"`
- [ ] Build: `pnpm run build`
- [ ] Test: `pnpm run test`
- [ ] Lint: `pnpm run lint`
- [ ] Publish types: `pnpm --filter @uplnk/types publish`
- [ ] Publish core: `pnpm --filter @uplnk/core publish`
- [ ] Tag: `git tag v0.1.0`
- [ ] Push: `git push && git push --tags`
- [ ] Create GitHub release
- [ ] Verify on npm
- [ ] Test installation in fresh project
```

## Need Help?

- npm documentation: https://docs.npmjs.com/
- npm support: https://www.npmjs.com/support
- Semantic Versioning: https://semver.org/

## Current Status

**Published Versions:**
- @uplnk/types: Check at https://www.npmjs.com/package/@uplnk/types
- @uplnk/core: Check at https://www.npmjs.com/package/@uplnk/core

**Next Release:** 0.1.0 (first public release)