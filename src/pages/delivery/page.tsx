/**
 * Delivery Page
 * Redirects to Delivery > Prioritize
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function DeliveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/delivery/prioritize', { replace: true });
  }, [navigate]);

  return <div />;
}
