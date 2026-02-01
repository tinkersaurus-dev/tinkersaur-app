/**
 * Delivery Page
 * Redirects to Delivery > Prioritize
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/app/layouts/MainLayout';

export default function DeliveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/delivery/prioritize', { replace: true });
  }, [navigate]);

  return (
    <MainLayout>
      <div />
    </MainLayout>
  );
}
