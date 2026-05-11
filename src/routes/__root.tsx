import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { BikeSelectionProvider } from '../lib/bike-selection-context'
import { Button } from '../components/ui/button'
import { Bike, Flame, ListChecks } from 'lucide-react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Bosch eBike Stats' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

const navLinkClass =
  'text-slate-500 hover:text-slate-900 [&.active]:font-semibold [&.active]:text-indigo-600'

function RootLayout() {
  const { userInfo, logout, isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop nav — hidden below 500px */}
      <nav className="sticky top-0 z-10 hidden items-center gap-6 border-b border-[var(--line)] bg-[var(--header-bg)] px-8 py-3 text-sm font-medium backdrop-blur-sm min-[500px]:flex">
        <Link to="/" className={navLinkClass}>
          Bikes
        </Link>
        <Link to="/activities" search={{ activityId: undefined }} className={navLinkClass}>
          Activities
        </Link>
        <Link to="/heatmap" className={navLinkClass}>
          Heatmap
        </Link>
        {isAuthenticated && (
          <div className="ml-auto flex items-center gap-4">
            {(userInfo?.email || userInfo?.name) && (
              <span className="text-xs text-gray-500">{userInfo.email ?? userInfo.name}</span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </nav>

      {/* Mobile top bar — visible below 500px */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-sm min-[500px]:hidden">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Bosch eBike Stats
        </span>
        {isAuthenticated && (
          <Button variant="outline" size="sm" onClick={logout}>
            Sign out
          </Button>
        )}
      </div>

      <main className="flex-1 min-[500px]:pb-0 pb-[60px]">
        <Outlet />
      </main>

      <footer className="hidden min-h-[40px] items-center justify-between border-t border-[var(--line)] bg-[var(--header-bg)] px-8 text-xs text-slate-400 min-[500px]:flex">
        <span>© {new Date().getFullYear()} Clément Devos</span>
        <a
          href="https://github.com/clementdevos/bosch-ebike-smartsystem-stats"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-600"
        >
          GitHub
        </a>
      </footer>

      {/* Mobile bottom tab nav — visible below 500px */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-sm min-[500px]:hidden">
        <Link
          to="/"
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-slate-500 [&.active]:text-indigo-600"
        >
          <Bike className="size-5" />
          Bikes
        </Link>
        <Link
          to="/activities"
          search={{ activityId: undefined }}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-slate-500 [&.active]:text-indigo-600"
        >
          <ListChecks className="size-5" />
          Activities
        </Link>
        <Link
          to="/heatmap"
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-slate-500 [&.active]:text-indigo-600"
        >
          <Flame className="size-5" />
          Heatmap
        </Link>
      </nav>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
      })
  )

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BikeSelectionProvider>{children}</BikeSelectionProvider>
          </AuthProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
