/**
 * Cast Layout
 * Wraps cast pages with authentication check
 */

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { Loader2 } from 'lucide-react';

export default function CastLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useCastAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/cast/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
