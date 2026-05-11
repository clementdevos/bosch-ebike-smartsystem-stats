# TanStack Reference

Boilerplate docs for the TanStack stack used in this project.

## Routing

File-based routing via [TanStack Router](https://tanstack.com/router). Routes are files in `src/routes/`.

### Adding a route

Create a file — the router auto-generates the route tree.

### Links

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/activities">Activities</Link>
```

### Layout

Edit `src/routes/__root.tsx`. Anything in `RootLayout` renders on every route.

## Server Functions

```tsx
import { createServerFn } from '@tanstack/react-start'

const getData = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => input as { id: string })
  .handler(async (ctx) => {
    // runs on server only
    return fetch(`https://api.example.com/${ctx.data.id}`).then(r => r.json())
  })

// call from client
const result = await getData({ data: { id: '123' } })
```

## Data loading with loaders

```tsx
export const Route = createFileRoute('/people')({
  loader: async () => {
    const res = await fetch('https://swapi.dev/api/people')
    return res.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return <ul>{data.results.map(p => <li key={p.name}>{p.name}</li>)}</ul>
}
```

## Styling

[Tailwind CSS v4](https://tailwindcss.com). Import in `src/styles.css`.

To remove Tailwind:
1. Delete `src/routes/demo/` if present
2. Replace Tailwind import in `src/styles.css`
3. Remove `tailwindcss()` from `vite.config.ts`
4. `npm uninstall @tailwindcss/vite tailwindcss`

## Deployment

Nitro builds a self-contained Node server:

```bash
npm run build
node dist/server/index.mjs
```

For platform presets (Vercel, Netlify, Cloudflare, etc.) see [nitro.build/deploy](https://v3.nitro.build/deploy).

## Adding Shadcn components

```bash
pnpm dlx shadcn@latest add button
```

## Further reading

- [TanStack Start docs](https://tanstack.com/start)
- [TanStack Router docs](https://tanstack.com/router)
- [Nitro docs](https://nitro.build)
