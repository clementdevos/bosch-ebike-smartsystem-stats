import { useQuery } from '@tanstack/react-query'
import { fetchBikes } from '../../server/bikes'
import { useAuth } from '../../lib/auth-context'

export function useBikes() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['bikes'],
    queryFn: () => fetchBikes(),
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  })
}
