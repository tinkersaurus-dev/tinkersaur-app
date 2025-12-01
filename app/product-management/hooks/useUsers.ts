/**
 * Users hooks - Data access for users
 */

import { useEffect } from 'react';
import { useUserStore } from '~/core/entities/product-management';

/**
 * Hook to fetch and access all users for a team
 */
export function useUsers(teamId: string) {
  const users = useUserStore((state) => state.entities);
  const loading = useUserStore((state) => state.loading);
  const error = useUserStore((state) => state.error);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers(teamId);
  }, [teamId, fetchUsers]);

  return { users, loading, error };
}

/**
 * Hook to access a single user by ID
 */
export function useUser(userId: string | undefined) {
  const user = useUserStore((state) =>
    userId ? state.entities.find((u) => u.id === userId) : undefined
  );
  const loading = useUserStore((state) => state.loading);
  const error = useUserStore((state) => state.error);

  return { user, loading, error };
}
