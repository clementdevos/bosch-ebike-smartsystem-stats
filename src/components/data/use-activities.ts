import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchActivitiesPage } from '../../server/activities'
import { useAuth } from '../../lib/auth-context'

export function useActivities() {
  const { tokenSet } = useAuth()
  return useInfiniteQuery({
    queryKey: ['activities', tokenSet?.accessToken],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchActivitiesPage({ data: { accessToken: tokenSet!.accessToken, offset: pageParam } }),
    getNextPageParam: (lastPage) => {
      const { offset, limit, total } = lastPage.pagination
      const next = offset + limit
      return next < total ? next : undefined
    },
    initialPageParam: 0,
    enabled: !!tokenSet,
    staleTime: 5 * 60 * 1000,
  })
}
