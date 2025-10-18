import { createClient } from './supabase/client';

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'Learner' | 'Professional';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription !== null && subscription.status === 'active';
}

export async function getUserTier(userId: string): Promise<'Free' | 'Learner' | 'Professional'> {
  const subscription = await getUserSubscription(userId);
  if (!subscription || subscription.status !== 'active') {
    return 'Free';
  }
  return subscription.tier;
}

export function canAccessFeature(userTier: 'Free' | 'Learner' | 'Professional', requiredTier: 'Free' | 'Learner' | 'Professional'): boolean {
  const tierHierarchy = {
    'Free': 0,
    'Learner': 1,
    'Professional': 2
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}
