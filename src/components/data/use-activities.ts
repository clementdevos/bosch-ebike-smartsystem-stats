import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchActivitiesPage } from '../../server/activities'
import { useAuth } from '../../lib/auth-context'

export function useActivities() {
  const { isAuthenticated } = useAuth()
  return useInfiniteQuery({
    queryKey: ['activities'],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchActivitiesPage({ data: { offset: pageParam } }),
    getNextPageParam: (lastPage) => {
      const { offset, limit, total } = lastPage.pagination
      const next = offset + limit
      return next < total ? next : undefined
    },
    initialPageParam: 0,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}
