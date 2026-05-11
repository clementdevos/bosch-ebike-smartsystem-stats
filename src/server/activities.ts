import { createServerFn } from '@tanstack/react-start'

const API_BASE = 'https://api.bosch-ebike.com/activity/smart-system/v1'

export interface ActivitySpeed {
  average: number
  maximum: number
}

export interface ActivityCadence {
  average: number
  maximum: number
}

export interface ActivityRiderPower {
  average: number
  maximum: number
}

export interface ActivityElevation {
  gain: number
  loss: number
}

export interface ActivitySummary {
  id: string
  startTime: string
  endTime: string
  timeZone: string
  durationWithoutStops: number
  title?: string
  bikeId: string
  startOdometer: number
  distance: number
  speed: ActivitySpeed
  cadence: ActivityCadence
  riderPower: ActivityRiderPower
  elevation: ActivityElevation
  caloriesBurned?: number
}

export interface PaginationLinks {
  self: string
  prev?: string
  next?: string
  first?: string
  last?: string
}

export interface ActivitiesPage {
  pagination: { total: number; offset: number; limit: number }
  activitySummaries: ActivitySummary[]
  links: PaginationLinks
}

export interface ActivityDetailPoint {
  distance: number
  altitude: number
  speed: number
  cadence: number
  latitude: number
  longitude: number
  riderPower: number
}

export interface ActivityDetailsResponse {
  activityDetails: ActivityDetailPoint[]
}

export const fetchActivityDetails = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { accessToken: string; activityId: string })
  .handler(async (ctx) => {
    const { accessToken, activityId } = ctx.data
    const res = await fetch(`${API_BASE}/activities/${activityId}/details`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`fetchActivityDetails failed: ${res.status} ${text}`)
    }
    return res.json() as Promise<ActivityDetailsResponse>
  })

export const fetchActivitiesPage = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => input as { accessToken: string; offset?: number; limit?: number; sort?: string })
  .handler(async (ctx) => {
    const { accessToken, offset = 0, sort = '-startTime' } = ctx.data
    const url = new URL(`${API_BASE}/activities`)
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(100))
    url.searchParams.set('sort', sort)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`fetchActivities failed: ${res.status} ${text}`)
    }
    return res.json() as Promise<ActivitiesPage>
  })
