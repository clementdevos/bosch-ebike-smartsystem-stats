'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce'
import { AUTH_CONFIG } from './auth-config'

export interface TokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

interface AuthContextValue {
  tokenSet: TokenSet | null
  login: () => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEYS = {
  codeVerifier: 'pkce_code_verifier',
  state: 'pkce_state',
  tokens: 'bosch_tokens',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokenSet, setTokenSet] = useState<TokenSet | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.tokens)
    if (stored) setTokenSet(JSON.parse(stored) as TokenSet)
  }, [])

  async function login() {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()

    sessionStorage.setItem(STORAGE_KEYS.codeVerifier, verifier)
    sessionStorage.setItem(STORAGE_KEYS.state, state)

    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: AUTH_CONFIG.scope,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    })

    window.location.href = `${AUTH_CONFIG.authorizationEndpoint}?${params}`
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.tokens)
    setTokenSet(null)
  }

  async function handleCallback() {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error, url.searchParams.get('error_description'))
      window.history.replaceState({}, '', '/')
      return
    }

    if (!code) return

    const storedState = sessionStorage.getItem(STORAGE_KEYS.state)
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier)

    if (!codeVerifier || returnedState !== storedState) {
      console.error('State mismatch or missing verifier')
      window.history.replaceState({}, '', '/')
      return
    }

    sessionStorage.removeItem(STORAGE_KEYS.state)
    sessionStorage.removeItem(STORAGE_KEYS.codeVerifier)
    window.history.replaceState({}, '', '/')

    setIsLoading(true)
    try {
      const tokens = await exchangeCode(code, codeVerifier)
      sessionStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens))
      setTokenSet(tokens)
    } catch (err) {
      console.error('Token exchange failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (window.location.pathname === '/callback') {
      handleCallback()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ tokenSet, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

async function exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    code,
    code_verifier: codeVerifier,
  })

  const res = await fetch(AUTH_CONFIG.tokenEndpoint, {
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
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
