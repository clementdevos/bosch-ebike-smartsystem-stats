import { useSession } from '@tanstack/react-start/server'

const TOKEN_ENDPOINT =
  'https://p9.authz.bosch.com/auth/realms/obc/protocol/openid-connect/token'
const REFRESH_BUFFER_MS = 60_000

export interface UserInfo {
  email?: string
  name?: string
  sub?: string
}

export interface SessionPayload {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
  userInfo: UserInfo
}

export function sessionConfig() {
  const password = process.env.SESSION_SECRET
  if (!password) throw new Error('SESSION_SECRET env var is not set')
  return { password, name: 'bosch_session', maxAge: 60 * 60 * 24 * 30 }
}

export function parseIdToken(idToken: string): UserInfo {
  try {
    const payload = idToken.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return { email: decoded.email, name: decoded.name, sub: decoded.sub }
  } catch {
    return {}
  }
}

export async function getTokenFromSession(): Promise<string> {
  const session = await useSession<SessionPayload>(sessionConfig())
  const data = session.data as Partial<SessionPayload>

  if (!data.accessToken) throw new Error('Not authenticated')

  if (Date.now() >= (data.expiresAt ?? 0) - REFRESH_BUFFER_MS) {
    if (!data.refreshToken) throw new Error('Session expired — please sign in again')

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: import.meta.env.VITE_BOSCH_CLIENT_ID as string,
      refresh_token: data.refreshToken,
    })

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token refresh failed: ${res.status} ${text}`)
    }

    const json = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
      id_token?: string
    }

    const updated: SessionPayload = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? data.refreshToken,
      expiresAt: Date.now() + json.expires_in * 1000,
      userInfo: json.id_token ? parseIdToken(json.id_token) : (data.userInfo ?? {}),
    }

    await session.update(updated)
    return updated.accessToken
  }

  return data.accessToken
}
