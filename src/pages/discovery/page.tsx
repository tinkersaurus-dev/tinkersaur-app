/**
 * Discovery Page
 * Redirects to Discovery > Coverage
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function DiscoveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/discovery/coverage', { replace: true });
  }, [navigate]);

  return <div />;
}
