'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce'
import { AUTH_CONFIG } from './auth-config'
import { exchangeCodeFn, logoutFn, getSessionUserFn, type UserInfo } from '../server/auth'

export type { UserInfo }

interface AuthContextValue {
  isAuthenticated: boolean
  userInfo: UserInfo | null
  login: () => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PKCE_KEYS = {
  codeVerifier: 'pkce_code_verifier',
  state: 'pkce_state',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (window.location.pathname === '/callback') {
      handleCallback()
      return
    }

    getSessionUserFn()
      .then((info) => {
        if (info) {
          setIsAuthenticated(true)
          setUserInfo(info)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  async function login() {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()

    sessionStorage.setItem(PKCE_KEYS.codeVerifier, verifier)
    sessionStorage.setItem(PKCE_KEYS.state, state)

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
    logoutFn().catch(console.error)
    setIsAuthenticated(false)
    setUserInfo(null)
    queryClient.clear()
  }

  async function handleCallback() {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error, url.searchParams.get('error_description'))
      window.history.replaceState({}, '', '/')
      setIsLoading(false)
      return
    }

    if (!code) {
      setIsLoading(false)
      return
    }

    const storedState = sessionStorage.getItem(PKCE_KEYS.state)
    const codeVerifier = sessionStorage.getItem(PKCE_KEYS.codeVerifier)

    if (!codeVerifier || returnedState !== storedState) {
      console.error('State mismatch or missing verifier')
      window.history.replaceState({}, '', '/')
      setIsLoading(false)
      return
    }

    sessionStorage.removeItem(PKCE_KEYS.state)
    sessionStorage.removeItem(PKCE_KEYS.codeVerifier)
    window.history.replaceState({}, '', '/')

    try {
      const result = await exchangeCodeFn({
        data: { code, codeVerifier, redirectUri: AUTH_CONFIG.redirectUri },
      })
      setIsAuthenticated(true)
      setUserInfo(result.userInfo)
    } catch (err) {
      console.error('Token exchange failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userInfo, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
