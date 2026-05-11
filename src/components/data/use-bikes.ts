import { useQuery } from '@tanstack/react-query'
import { fetchBikes } from '../../server/bikes'
import { useAuth } from '../../lib/auth-context'

export function useBikes() {
  const { tokenSet } = useAuth()
  return useQuery({
    queryKey: ['bikes', tokenSet?.accessToken],
    queryFn: () => fetchBikes({ data: tokenSet!.accessToken }),
    enabled: !!tokenSet,
    staleTime: 60 * 60 * 1000,
  })
}
