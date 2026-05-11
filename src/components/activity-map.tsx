'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ActivityDetailPoint } from '../server/activities'

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [16, 16] })
  }, [map, positions])
  return null
}

export function ActivityMap({
  points,
  hoveredPoint,
}: {
  points: ActivityDetailPoint[]
  hoveredPoint?: ActivityDetailPoint | null
}) {
  const positions = points
    .filter((p) => p.latitude !== 0 && p.longitude !== 0)
    .map((p) => [p.latitude, p.longitude] as [number, number])

  if (positions.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex h-[260px] items-center justify-center rounded-lg text-sm">
        No GPS data
      </div>
    )
  }

  const center = positions[Math.floor(positions.length / 2)]
  const markerPos =
    hoveredPoint && hoveredPoint.latitude !== 0 && hoveredPoint.longitude !== 0
      ? ([hoveredPoint.latitude, hoveredPoint.longitude] as [number, number])
      : null

  return (
    <div className="overflow-hidden rounded-lg" style={{ height: 260 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Polyline positions={positions} color="#2563eb" weight={3} opacity={0.85} />
        <FitBounds positions={positions} />
        {markerPos && (
          <CircleMarker
            center={markerPos}
            radius={6}
            pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
