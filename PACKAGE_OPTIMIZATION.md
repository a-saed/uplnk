# Package Optimization Summary

This document explains how the uplnk packages are optimized for minimal size and best performance.

## 📦 Published Package Sizes

### @uplnk/core
- **Packed size:** 9.3 KB
- **Unpacked size:** 36.6 KB
- **Files included:** 4 files only
  - `dist/index.js` (16.6 KB) - Main bundle
  - `dist/index.d.ts` (13.8 KB) - TypeScript definitions
  - `README.md` (4.9 KB) - Documentation
  - `package.json` (1.4 KB) - Metadata

### @uplnk/types
- **Packed size:** 1.7 KB
- **Unpacked size:** 4.0 KB
- **Files included:** 4 files only
  - `dist/index.d.ts` (2.6 KB) - TypeScript definitions
  - `dist/index.js` (70 B) - Minimal runtime
  - `README.md` (203 B) - Documentation
  - `package.json` (1.0 KB) - Metadata

## ✅ What Gets Published

Only essential files are included in the npm package:

```
@uplnk/core/
├── dist/
│   ├── index.js          # Main bundle
│   └── index.d.ts        # Type definitions
├── README.md             # Basic usage documentation
└── package.json          # Package metadata
```

## 🚫 What Gets Excluded

The following are automatically excluded from npm packages:

### Source Files
- `src/` directory (only compiled `dist/` is published)
- `*.test.ts` files
- `*.spec.ts` files
- Test directories

### Configuration Files
- `tsconfig.json`
- `tsup.config.ts`
- `vitest.config.ts`
- `.eslintrc*`
- `.prettierrc*`

### Development Files
- `.github/` workflows
- Documentation site files (`packages/docs/`)
- Publishing guides (`PUBLISHING.md`, `NPM_SETUP.md`, etc.)
- CHANGELOG.md (users should check GitHub releases)

### Build Artifacts
- `node_modules/`
- Test coverage files
- Log files

## 🎯 Optimization Strategies

### 1. Explicit Files Field

In `package.json`:
```json
{
  "files": [
    "dist",
    "README.md"
  ]
}
```

This explicitly includes only what's needed.

### 2. .npmignore Files

Additional safety layer to exclude development files:
- `packages/core/.npmignore`
- `packages/types/.npmignore`

### 3. Tree-Shaking Support

```json
{
  "sideEffects": false
}
```

Tells bundlers (webpack, rollup, etc.) that all exports are side-effect free, enabling aggressive tree-shaking.

### 4. ESM Only

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

Only ESM format is published, which is optimal for modern bundlers.

### 5. Workspace Protocol

During development:
```json
{
  "dependencies": {
    "@uplnk/types": "workspace:*"
  }
}
```

pnpm automatically converts this to the actual version during publishing:
```json
{
  "dependencies": {
    "@uplnk/types": "^0.1.0"
  }
}
```

## 📊 Size Comparison

### What Users Download

When a user installs `@uplnk/core`:
- **Total download:** ~9.3 KB (gzipped even smaller!)
- **No unnecessary files:** Source code, tests, configs excluded
- **No docs bloat:** Full docs at https://a-saed.github.io/uplnk/

### Monorepo Size vs Published Size

| Location | Size | Contents |
|----------|------|----------|
| GitHub repo | ~2 MB | All packages, docs, tests, configs |
| @uplnk/core npm | 9.3 KB | Only runtime code |
| @uplnk/types npm | 1.7 KB | Only type definitions |

**Reduction:** ~99.5% smaller than the full repository!

## 🔍 Verification

To verify what will be published:

```bash
# Check @uplnk/core
cd packages/core
npm pack --dry-run

# Check @uplnk/types
cd packages/types
npm pack --dry-run
```

This shows exactly what files will be included in the tarball.

## 🚀 Benefits for Users

1. **Fast Installation:** Small package size = quick downloads
2. **Minimal Disk Space:** Only 40 KB total for both packages
3. **Better Tree-Shaking:** Only import what you use
4. **Clean node_modules:** No clutter from dev files
5. **Security:** Less surface area, no build configs exposed

## 📝 Best Practices Applied

✅ **Only ship compiled code** - No source files  
✅ **No dev dependencies in bundle** - They're in devDependencies  
✅ **No tests in package** - Tests run in CI, not in user's project  
✅ **No config files** - Users don't need our build config  
✅ **Minimal README** - Full docs on dedicated site  
✅ **Tree-shakeable** - sideEffects: false  
✅ **Modern format** - ESM for best bundler support  

## 🎓 For Future Package Updates

When adding new features, keep packages lightweight:

1. **Add to source, not dist:** New files go in `src/`, get compiled to `dist/`
2. **Tests stay in tests:** Use `.test.ts` suffix (auto-excluded)
3. **Docs go to website:** Update docs site, not package README
4. **Dev tools in devDependencies:** Never in dependencies
5. **Verify before publishing:** Run `npm pack --dry-run`

## 📚 References

- npm documentation: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- Tree-shaking guide: https://webpack.js.org/guides/tree-shaking/
- Package publishing best practices: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry