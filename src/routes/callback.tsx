import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/callback')({ component: Callback })

function Callback() {
  const { isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      navigate({ to: '/' })
    }
  }, [isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Signing in...</p>
    </div>
  )
}
