'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { useHydrated } from '@/components/client-ready';
export const defaultSettings = {
  announcement: 'Complimentary delivery on orders over €300',
  homeTitle: 'A wardrobe, considered.',
  homeDescription:
    'Beautiful pieces. Natural materials. An ease that stays with you, season after season.',
  newsletterTitle: 'A letter from Lune.',
  newsletterDescription:
    'New collections, stories and small things worth sharing. A little inspiration, occasionally.',
  contactEmail: 'hello@atelierlune.example',
};
export type SiteSettings = typeof defaultSettings;
export function useSiteSettings() {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<SiteSettings>('settings'),
    staleTime: 60_000,
  });
  return hydrated ? query.data || defaultSettings : defaultSettings;
}
