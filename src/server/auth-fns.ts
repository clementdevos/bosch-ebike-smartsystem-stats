import { createServerFn } from '@tanstack/react-start'

const TOKEN_ENDPOINT =
  'https://p9.authz.bosch.com/auth/realms/obc/protocol/openid-connect/token'

export interface UserInfo {
  email?: string
  name?: string
  sub?: string
}

interface SessionPayload {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
  userInfo: UserInfo
}

function sessionConfig() {
  const password = process.env.SESSION_SECRET
  if (!password) throw new Error('SESSION_SECRET env var is not set')
  return { password, name: 'bosch_session', maxAge: 60 * 60 * 24 * 30 }
}

function parseIdToken(idToken: string): UserInfo {
  try {
    const payload = idToken.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return { email: decoded.email, name: decoded.name, sub: decoded.sub }
  } catch {
    return {}
  }
}

export const exchangeCodeFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: unknown) => input as { code: string; codeVerifier: string; redirectUri: string }
  )
  .handler(async (ctx) => {
    const { useSession } = await import('@tanstack/react-start/server')
    const { code, codeVerifier, redirectUri } = ctx.data

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: import.meta.env.VITE_BOSCH_CLIENT_ID as string,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    })

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token exchange failed: ${res.status} ${text}`)
    }

    const data = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
      id_token?: string
    }

    const userInfo: UserInfo = data.id_token ? parseIdToken(data.id_token) : {}

    const session = await useSession<SessionPayload>(sessionConfig())
    await session.update({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: Date.now() + data.expires_in * 1000,
      userInfo,
    })

    return { userInfo }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { useSession } = await import('@tanstack/react-start/server')
  const session = await useSession<SessionPayload>(sessionConfig())
  await session.clear()
})

export const getSessionUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { useSession } = await import('@tanstack/react-start/server')
  const session = await useSession<SessionPayload>(sessionConfig())
  const { accessToken, userInfo } = session.data as Partial<SessionPayload>
  if (!accessToken) return null
  return userInfo ?? null
})
