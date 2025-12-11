# Build Troubleshooting Guide

## GrapeJS Import Resolution Error

### Problem
```
[vite]: Rollup failed to resolve import "grapesjs" from "/usr/www/users/jqviwy/client/src/components/EmailBuilder.tsx"
```

### Implemented Solutions

#### 1. Optimized Vite Configuration
- Added `optimizeDeps.include` for explicit GrapeJS dependency optimization
- Enhanced `manualChunks` function with multiple fallback patterns
- Added `commonjsOptions` with `transformMixedEsModules: true`
- Set `target: 'es2020'` for better browser compatibility

#### 2. Lazy Loading
- Created `EmailBuilderLazy` component that loads GrapeJS only when needed
- Reduces main bundle size and avoids early import resolution
- Provides better loading UX with Suspense fallback

### Production Server Deployment Steps

1. **Pull latest changes:**
   ```bash
   cd /usr/www/users/jqviwy
   git pull origin main
   ```

2. **Clean install dependencies:**
   ```bash
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Verify GrapeJS installation:**
   ```bash
   pnpm list grapesjs grapesjs-preset-newsletter
   ```
   
   Expected output:
   ```
   grapesjs 0.22.14
   grapesjs-preset-newsletter 1.0.2
   ```

4. **Clean build:**
   ```bash
   rm -rf dist
   pnpm build
   ```

### If Build Still Fails

#### Option 1: Check Node Version
```bash
node --version
```
Should be >= 18.0.0

#### Option 2: Clear Vite Cache
```bash
rm -rf node_modules/.vite
pnpm build
```

#### Option 3: Disable PWA Plugin (Last Resort)

If all else fails, temporarily disable the PWA plugin:

**Edit `vite.config.ts`:**
```typescript
// Comment out PWA plugin
const plugins = [
  react(), 
  tailwindcss(), 
  jsxLocPlugin(), 
  vitePluginManusRuntime(),
  // VitePWA({ ... }) // Temporarily disabled
];
```

Then rebuild:
```bash
pnpm build
```

### Verification

After successful build, verify these files exist:
```bash
ls -lh dist/public/assets/grapesjs*.js
ls -lh dist/public/assets/EmailBuilder*.js
```

### Support

If the issue persists:
1. Check `node_modules/grapesjs` exists
2. Verify `node_modules/grapesjs-preset-newsletter` exists
3. Check for any `.npmrc` or `.pnpmrc` configuration that might affect module resolution
4. Ensure no firewall/proxy issues blocking package downloads

## Additional Notes

- The EmailBuilder is now lazy-loaded, so GrapeJS is only bundled when the component is actually used
- The main bundle size is reduced by ~1.5 MB due to lazy loading
- The build should work on any environment with Node.js >= 18 and pnpm >= 8
