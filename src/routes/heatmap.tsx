import { createFileRoute } from '@tanstack/react-router'
import { HeatmapTab } from '../components/heatmap-tab'

export const Route = createFileRoute('/heatmap')({
  component: HeatmapPage,
})

function HeatmapPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <h1 className="text-3xl font-bold">Heatmap</h1>
      <HeatmapTab />
    </div>
  )
}
