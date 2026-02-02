import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireApproval?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = false
}: ProtectedRouteProps) {
  const { user, role, profile, loading, isApproved } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if client profile is incomplete (missing company_name or phone)
  // Don't redirect if already on complete-profile page to avoid infinite loop
  if (role === 'client' && profile && (!profile.company_name || !profile.phone) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = role === 'admin' ? '/admin' : role === 'worker' ? '/worker' : '/client';
    return <Navigate to={redirectPath} replace />;
  }

  if (requireApproval && !isApproved && role === 'client') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}

