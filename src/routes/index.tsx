import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { fetchBikes, type Bike } from '../server/bikes'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { tokenSet, login, logout, isLoading } = useAuth()
  const [bikes, setBikes] = useState<Bike[] | null>(null)
  const [bikesLoading, setBikesLoading] = useState(false)
  const [bikesError, setBikesError] = useState<string | null>(null)

  useEffect(() => {
    if (tokenSet && !isLoading) loadBikes()
  }, [tokenSet, isLoading])

  async function loadBikes() {
    if (!tokenSet) return
    setBikesLoading(true)
    setBikesError(null)
    try {
      const data = await fetchBikes({ data: tokenSet.accessToken })
      setBikes(data.bikes)
    } catch (err) {
      setBikesError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBikesLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Signing in...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Bosch eBike Stats</h1>
        {tokenSet ? (
          <div className="flex gap-3">
            <button
              onClick={loadBikes}
              disabled={bikesLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {bikesLoading ? 'Loading...' : 'Load Bikes'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign in with Bosch
          </button>
        )}
      </div>

      {bikesError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {bikesError}
        </div>
      )}

      {bikes && (
        <div className="space-y-4">
          {bikes.length === 0 && <p className="text-gray-500">No bikes found.</p>}
          {bikes.map((bike) => (
            <BikeCard key={bike.driveUnit.serialNumber} bike={bike} />
          ))}
        </div>
      )}

      {!tokenSet && !bikes && (
        <p className="text-gray-500">Sign in to view your eBike data.</p>
      )}
    </div>
  )
}

function ComponentInfo({ label, component }: { label: string; component: { productName?: string; serialNumber: string; partNumber: string } | undefined }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
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
    <div className="border rounded-lg p-5 space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{driveUnit.productName ?? driveUnit.serialNumber}</h2>
        <p className="text-gray-500 text-xs font-mono">{bike.id}</p>
      </div>
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
            <dd>{driveUnit.powerOnTime.total} h ({driveUnit.powerOnTime.withMotorSupport} h motor)</dd>
          </>
        )}
      </dl>
      <ComponentInfo label="Remote control" component={remoteControl} />
      <ComponentInfo label="Head unit" component={headUnit} />
      {batteries.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Batteries</p>
          {batteries.map((b) => (
            <p key={b.serialNumber} className="text-sm text-gray-600">
              {b.productName} — {b.serialNumber}
              {b.chargeCycles && ` (${b.chargeCycles.total} cycles)`}
            </p>
          ))}
        </div>
      )}
      <div className="border-t pt-3">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {showRaw ? 'Hide raw' : 'Show raw'}
        </button>
        {showRaw && (
          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(bike, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
