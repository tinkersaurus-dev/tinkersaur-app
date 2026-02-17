/**
 * Analyze Page
 * Redirects to Analyze > Heatmap
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function AnalyzePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/discovery/analyze/heatmap', { replace: true });
  }, [navigate]);

  return <div />;
}
