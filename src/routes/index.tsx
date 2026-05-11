import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { useBikes } from '../components/data/use-bikes'
import type { Bike } from '../server/bikes'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function Home() {
  const { isAuthenticated, login, isLoading } = useAuth()

  const { data, isFetching, error, refetch, dataUpdatedAt } = useBikes()

  const bikes = data?.bikes ?? null

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Signing in...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your garage</h1>
        {!isAuthenticated && <Button onClick={login}>Sign in with Bosch</Button>}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {bikes && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Updated {dataUpdatedAt ? fmtTime(dataUpdatedAt) : '—'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {bikes.length === 0 && (
              <p className="text-gray-500">
                No bikes found.{' '}
                <a
                  href="https://flow.bosch-ebike.com/data-act"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enable third-party app access
                </a>{' '}
                in the Bosch eBike Flow portal, then refresh.
              </p>
            )}
            {bikes.map((bike) => (
              <BikeCard key={bike.driveUnit.serialNumber} bike={bike} />
            ))}
          </div>
        </>
      )}

      {!isAuthenticated && (
        <div className="space-y-3">
          <p className="text-gray-500">Sign in to view your eBike data.</p>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <p className="mb-2 font-medium text-slate-700 dark:text-slate-300">
              Session &amp; security
            </p>
            <ul className="space-y-1.5">
              <li>
                Auth uses <strong>OAuth 2.0 + PKCE</strong> via Bosch SingleKey ID — no password is
                ever handled by this app.
              </li>
              <li>
                Tokens are stored in an <strong>encrypted, HttpOnly server-side cookie</strong>.
                They are never exposed to the browser or JavaScript.
              </li>
              <li>
                The cookie is encrypted with AES-GCM using a server-only secret. Even if the cookie
                is intercepted, the raw tokens cannot be read.
              </li>
              <li>
                Session lasts up to <strong>30 days</strong>. The access token is automatically
                refreshed server-side before it expires — no re-login needed.
              </li>
              <li>
                No eBike data, tokens, or personal information is stored in any database. The server
                logs nothing.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function ComponentInfo({
  label,
  component,
}: {
  label: string
  component: { productName?: string; serialNumber: string; partNumber: string } | undefined
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      {component ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {component.productName && (
            <>
              <dt className="text-gray-500">Name</dt>
              <dd>{component.productName}</dd>
            </>
          )}
          <dt className="text-gray-500">Serial</dt>
          <dd className="font-mono">{component.serialNumber}</dd>
          <dt className="text-gray-500">Part number</dt>
          <dd className="font-mono">{component.partNumber}</dd>
        </dl>
      ) : (
        <p className="text-sm text-gray-400">None</p>
      )}
    </div>
  )
}

function BikeCard({ bike }: { bike: Bike }) {
  const { driveUnit, batteries, headUnit, remoteControl } = bike
  const [showRaw, setShowRaw] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{driveUnit.productName ?? driveUnit.serialNumber}</CardTitle>
        <CardDescription className="font-mono">{bike.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Drive unit serial</dt>
          <dd className="font-mono">{driveUnit.serialNumber}</dd>
          {driveUnit.odometer != null && (
            <>
              <dt className="text-gray-500">Odometer</dt>
              <dd>{(driveUnit.odometer / 1000).toFixed(1)} km</dd>
            </>
          )}
          {driveUnit.maximumAssistanceSpeed != null && (
            <>
              <dt className="text-gray-500">Max assist speed</dt>
              <dd>{driveUnit.maximumAssistanceSpeed} km/h</dd>
            </>
          )}
          {driveUnit.powerOnTime && (
            <>
              <dt className="text-gray-500">Power-on time</dt>
              <dd>
                {driveUnit.powerOnTime.total} h ({driveUnit.powerOnTime.withMotorSupport} h motor)
              </dd>
            </>
          )}
        </dl>
        <ComponentInfo label="Remote control" component={remoteControl} />
        <ComponentInfo label="Head unit" component={headUnit} />
        {batteries.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">Batteries</p>
            {batteries.map((b) => (
              <p key={b.serialNumber} className="text-sm text-gray-600">
                {b.productName} — {b.serialNumber}
                {b.chargeCycles && ` (${b.chargeCycles.total} cycles)`}
              </p>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRaw((v) => !v)}
          className="-ml-2.5 text-gray-400 hover:text-gray-600"
        >
          {showRaw ? 'Hide raw' : 'Show raw'}
        </Button>
        {showRaw && (
          <pre className="max-h-96 w-full overflow-auto rounded bg-gray-50 p-3 text-xs">
            {JSON.stringify(bike, null, 2)}
          </pre>
        )}
      </CardFooter>
    </Card>
  )
}
