/**
 * Discovery Index Route
 * Redirects to /discovery/solutions by default
 */

import { redirect } from 'react-router';

export function loader() {
  return redirect('/discovery/solutions');
}

export default function DiscoveryIndex() {
  return null;
}
