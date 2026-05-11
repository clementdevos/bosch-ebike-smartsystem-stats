import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { BikeSelectionProvider } from '../lib/bike-selection-context'
import { Button } from '../components/ui/button'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Bosch eBike Stats' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const { userInfo, logout, tokenSet } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="px-8 py-3 flex items-center gap-6 text-sm font-medium border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-sm sticky top-0 z-10">
        <Link to="/" className="text-slate-500 hover:text-slate-900 [&.active]:text-indigo-600 [&.active]:font-semibold">
          Bikes
        </Link>
        <Link to="/activities" search={{ activityId: undefined }} className="text-slate-500 hover:text-slate-900 [&.active]:text-indigo-600 [&.active]:font-semibold">
          Activities
        </Link>
        <Link to="/heatmap" className="text-slate-500 hover:text-slate-900 [&.active]:text-indigo-600 [&.active]:font-semibold">
          Heatmap
        </Link>
        {tokenSet && (
          <div className="ml-auto flex items-center gap-4">
            {(userInfo?.email || userInfo?.name) && (
              <span className="text-gray-500 text-xs">{userInfo.email ?? userInfo.name}</span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        )}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--line)] bg-[var(--header-bg)] px-8 text-xs text-slate-400 flex items-center justify-between min-h-[40px]">
        <span>© {new Date().getFullYear()} Clément Devos</span>
        <a
          href="https://github.com/clementdevos/bosch-ebike-smartsystem-stats"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 underline underline-offset-2"
        >
          GitHub
        </a>
      </footer>
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
            <BikeSelectionProvider>
              {children}
            </BikeSelectionProvider>
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
