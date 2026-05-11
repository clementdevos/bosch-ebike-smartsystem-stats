'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

type HeatPoint = [number, number, number]

const DEFAULT_CENTER: [number, number] = [50.85, 4.35]

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap()
  const layerRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (points.length === 0) return
    const layer = L.heatLayer(points, { radius: 6, blur: 4, maxZoom: 17 })
    layer.addTo(map)
    layerRef.current = layer
    return () => {
      map.removeLayer(layer)
      layerRef.current = null
    }
  }, [map, points])

  return null
}

function FitBounds({ points }: { points: HeatPoint[] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (points.length === 0 || fitted.current) return
    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng] as [number, number]))
    map.fitBounds(bounds, { padding: [32, 32] })
    fitted.current = true
  }, [map, points])
  return null
}

export default function HeatMap({ points }: { points: HeatPoint[] }) {
  return (
    <div className="overflow-hidden rounded-lg" style={{ height: 480 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <HeatLayer points={points} />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}
