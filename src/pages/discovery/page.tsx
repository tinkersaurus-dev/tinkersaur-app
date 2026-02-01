/**
 * Discovery Page
 * Redirects to Discovery > Intake
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function DiscoveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/discovery/intake', { replace: true });
  }, [navigate]);

  return <div />;
}
