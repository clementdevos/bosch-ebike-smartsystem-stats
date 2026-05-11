import { createFileRoute } from '@tanstack/react-router'
import { HeatmapTab } from '../components/heatmap-tab'

export const Route = createFileRoute('/heatmap')({
  component: HeatmapPage,
})

function HeatmapPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Heatmap</h1>
      <HeatmapTab />
    </div>
  )
}
