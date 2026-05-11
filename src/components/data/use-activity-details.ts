import { useQuery } from '@tanstack/react-query'
import { fetchActivityDetails } from '../../server/activities'
import { useAuth } from '../../lib/auth-context'

export function useActivityDetails(activityId: string | undefined) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['activity-details', activityId],
    queryFn: () => fetchActivityDetails({ data: { activityId: activityId! } }),
    enabled: !!activityId && isAuthenticated,
    staleTime: 30 * 60 * 1000,
  })
}
