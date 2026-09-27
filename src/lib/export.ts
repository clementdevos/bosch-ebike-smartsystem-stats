import type { ActivityDetailPoint, ActivitySummary } from '../server/activities'

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })
}

function hasFix(p: ActivityDetailPoint): boolean {
  return p.latitude !== 0 && p.longitude !== 0
}

export function toGpx(summary: ActivitySummary, points: ActivityDetailPoint[]): string {
  const name = xmlEscape(summary.title ?? 'Activity')
  const trkpts = points
    .filter(hasFix)
    .map((p) => `      <trkpt lat="${p.latitude}" lon="${p.longitude}"><ele>${p.altitude}</ele></trkpt>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="bosch-ebike-smartsystem-stats" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${summary.startTime}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`
}

export function toActivityJson(summary: ActivitySummary, points: ActivityDetailPoint[]): string {
  return JSON.stringify({ summary, activityDetails: points }, null, 2)
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
