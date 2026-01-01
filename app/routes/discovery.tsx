/**
 * Discovery Page
 * Redirects to Discovery > Intake
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '~/core/components/MainLayout';

export default function DiscoveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/discovery/intake', { replace: true });
  }, [navigate]);

  return (
    <MainLayout>
      <div />
    </MainLayout>
  );
}
