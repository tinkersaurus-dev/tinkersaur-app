type Handler = () => void | Promise<void>;

const logoutHandlers: Handler[] = [];
const teamChangeHandlers: Handler[] = [];

export function onLogout(handler: Handler) {
  logoutHandlers.push(handler);
}

export function onTeamChange(handler: Handler) {
  teamChangeHandlers.push(handler);
}

export async function runLogoutHandlers() {
  for (const handler of logoutHandlers) {
    await handler();
  }
}

export function runTeamChangeHandlers() {
  for (const handler of teamChangeHandlers) {
    handler();
  }
}
