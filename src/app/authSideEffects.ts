import { onLogout, onTeamChange } from '@/shared/auth';
import { disconnect } from '@/shared/signalr';
import { useSolutionStore } from '@/entities/solution';

// Wire up cross-layer side effects for auth lifecycle events.
// This runs at module load time in the app layer, which has access to
// both features and entities — keeping shared/auth free of upward imports.

onLogout(async () => {
  await disconnect();
  useSolutionStore.getState().clearSolution();
});

onTeamChange(() => {
  useSolutionStore.getState().clearSolution();
});
