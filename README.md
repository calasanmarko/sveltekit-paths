# SvelteKit Paths - Vite Plugin

A Vite plugin that automatically generates TypeScript types for all your SvelteKit routes, providing type-safe navigation and link generation.

## Features

- 🚀 **Automatic Route Discovery**: Scans your `src/routes` directory and generates types for all valid routes
- 🔧 **Complete SvelteKit Support**: Handles all SvelteKit routing conventions including:
    - Basic routes (`/about`, `/contact`)
    - Dynamic parameters (`/blog/[slug]`, `/users/[id]`)
    - Optional parameters (`/[[lang]]/about`)
    - Rest parameters (`/docs/[...path]`)
    - Route groups (`/(app)/dashboard`)
    - Parameter matchers (`/posts/[slug=string]`)
    - Nested routes and complex combinations
    - API routes (`+server.ts` files)
- 🔄 **Hot Reload**: Automatically updates types when routes change during development
- 📝 **TypeScript Integration**: Generates clean TypeScript module declarations

## Installation & Usage

### 1. Add to your Vite config

```typescript
// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import { sveltepaths } from "sveltekit-paths";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        sveltekit(),
        sveltepaths(), // Add the plugin
    ],
});
```

### 2. Use the generated types

The plugin creates a module declaration that you can import and use:

```typescript
// In your Svelte components or TypeScript files
import type { RoutePath } from "$sveltekit-paths";

// Type-safe navigation
import { goto } from "$app/navigation";

function navigateToPost(slug: string) {
    goto(`/blog/${slug}` satisfies RoutePath);
}

// Type-safe link creation
function createUserLink(userId: string): RoutePath {
    return `/users/${userId}`;
}
```

```svelte
<!-- In your Svelte components -->
<script lang="ts">
    import type { RoutePath } from "$sveltekit-paths";

    export let href: RoutePath;
</script>

<a {href}>Navigate</a>
```

## Example Generated Types

Given this route structure:

```
src/routes/
├── +page.svelte                    → /
├── about/+page.svelte              → /about
├── blog/
│   ├── +page.svelte                → /blog
│   └── [slug]/+page.svelte         → /blog/${string}
├── users/[id]/
│   ├── +page.svelte                → /users/${string}
│   └── settings/+page.svelte       → /users/${string}/settings
├── docs/[[version]]/
│   ├── +page.svelte                → /docs, /docs/${string}
│   └── guide/[[section]]/+page.svelte → /docs/guide, /docs/${string}/guide, /docs/${string}/guide/${string}
├── admin/[...path]/+page.svelte    → /admin/${string}
├── (app)/dashboard/+page.svelte    → /dashboard
└── api/users/[id]/+server.ts       → /api/users/${string}
```

The plugin generates:

```typescript
// .svelte-kit/types/sveltekit-paths/$types.d.ts
declare module "$sveltekit-paths" {
    export type RoutePath =
        | `/`
        | `/about`
        | `/blog`
        | `/blog/${string}`
        | `/users/${string}`
        | `/users/${string}/settings`
        | `/docs`
        | `/docs/${string}`
        | `/docs/guide`
        | `/docs/${string}/guide`
        | `/docs/${string}/guide/${string}`
        | `/admin/${string}`
        | `/dashboard`
        | `/api/users/${string}`;
}
```

## How It Works

1. **Route Scanning**: The plugin recursively scans your `src/routes` directory
2. **Convention Detection**: Identifies SvelteKit route files (`+page.svelte`, `+server.ts`)
3. **Path Processing**: Converts SvelteKit routing conventions to TypeScript template literal types:
    - `[param]` → `${string}`
    - `[[optional]]` → generates multiple route variants
    - `[...rest]` → `${string}`
    - `(groups)` → removed from final paths
4. **Type Generation**: Creates TypeScript module declarations in `.svelte-kit/types/sveltekit-paths/`
5. **Watch Mode**: Monitors route changes and regenerates types automatically

## Configuration

The plugin currently uses sensible defaults but scans from `src/routes` by default. The generated types are placed in `.svelte-kit/types/sveltekit-paths/$types.d.ts`.

## Benefits

- **Type Safety**: Catch invalid routes at compile time
- **IntelliSense**: Get autocomplete for all your routes
- **Refactoring**: Safe route renaming and restructuring
- **Documentation**: Generated types serve as route documentation
- **Performance**: No runtime overhead, purely build-time type generation

## Development

The plugin runs during both development and build:

- **Development**: Watches for route changes and updates types in real-time
- **Build**: Generates final types before the build process

## Troubleshooting

- **Types not updating**: Make sure the plugin is properly added to your Vite config
- **Missing routes**: Ensure your route files follow SvelteKit conventions (`+page.svelte`, `+server.ts`)
- **TypeScript errors**: Check that `.svelte-kit/types` is included in your `tsconfig.json` paths
