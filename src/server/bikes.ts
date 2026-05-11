import { createServerFn } from '@tanstack/react-start'

const API_BASE = 'https://api.bosch-ebike.com/bike-profile/smart-system/v1'

export interface BaseComponent {
  productName?: string
  serialNumber: string
  partNumber: string
}

export interface WalkAssistConfiguration {
  isEnabled: boolean
  maximumSpeed: number
}

export interface AssistMode {
  name: string
  reachableRange: number
}

export interface PowerOnTime {
  total: number
  withMotorSupport: number
}

export interface DriveUnit extends BaseComponent {
  odometer?: number
  rearWheelCircumferenceUser?: number
  maximumAssistanceSpeed?: number
  walkAssistConfiguration?: WalkAssistConfiguration
  activeAssistModes?: AssistMode[]
  powerOnTime?: PowerOnTime
}

export interface Battery extends BaseComponent {
  deliveredWhOverLifetime?: number
  chargeCycles?: {
    total: number
    onBike: number
    offBike: number
  }
}

export interface Bike {
  id: string
  oemId?: string
  createdAt: string
  language?: string
  driveUnit: DriveUnit
  batteries: Battery[]
  remoteControl: BaseComponent
  headUnit?: BaseComponent
  connectModule?: BaseComponent
  antiLockBrakeSystems?: BaseComponent[]
}

export interface BikesResponse {
  bikes: Bike[]
}

export const fetchBikes = createServerFn({ method: 'POST' })
  .inputValidator((accessToken: unknown) => {
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('accessToken required')
    }
    return accessToken
  })
  .handler(async (ctx) => {
    const accessToken = ctx.data
    const res = await fetch(`${API_BASE}/bikes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`listBikes failed: ${res.status} ${text}`)
    }

    return res.json() as Promise<BikesResponse>
  })
