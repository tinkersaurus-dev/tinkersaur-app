import { useAuthStore } from '../model/useAuthStore';

export function useCanEdit(): boolean {
  const selectedTeam = useAuthStore(state => state.selectedTeam);
  return selectedTeam?.canEdit ?? false;
}
