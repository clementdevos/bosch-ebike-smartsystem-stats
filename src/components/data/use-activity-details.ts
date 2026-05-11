import { useQuery } from '@tanstack/react-query'
import { fetchActivityDetails } from '../../server/activities'
import { useAuth } from '../../lib/auth-context'

export function useActivityDetails(activityId: string | undefined) {
  const { tokenSet } = useAuth()
  return useQuery({
    queryKey: ['activity-details', activityId],
    queryFn: () =>
      fetchActivityDetails({
        data: { accessToken: tokenSet!.accessToken, activityId: activityId! },
      }),
    enabled: !!activityId && !!tokenSet,
    staleTime: 30 * 60 * 1000,
  })
}
