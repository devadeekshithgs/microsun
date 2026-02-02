import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const WorkerRegister = lazy(() => import("@/pages/auth/WorkerRegister"));
const CompleteProfile = lazy(() => import("@/pages/auth/CompleteProfile"));
const PendingApproval = lazy(() => import("@/pages/PendingApproval"));

// Dashboard Pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const ClientDashboard = lazy(() => import("@/pages/client/Dashboard"));
const WorkerDashboard = lazy(() => import("@/pages/worker/Dashboard"));

const NotFound = lazy(() => import("@/pages/NotFound"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const DebugPage = lazy(() => import("@/pages/Debug"));

const queryClient = new QueryClient();

function RoleBasedRedirect() {
  const { role, profile, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if profile is incomplete (missing company_name or phone for non-admin clients)
  if (profile && role === 'client' && (!profile.company_name || !profile.phone)) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'worker') {
    return <Navigate to="/worker" replace />;
  }

  if (role === 'client') {
    if (!isApproved) {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/client" replace />;
  }

  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/worker-register" element={<WorkerRegister />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />

                {/* Pending Approval */}
                <Route path="/pending-approval" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <PendingApproval />
                  </ProtectedRoute>
                } />

                {/* Profile - accessible to all logged in users */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Worker Routes */}
                <Route path="/worker/*" element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                } />

                {/* Client Routes */}
                <Route path="/client/*" element={
                  <ProtectedRoute allowedRoles={['client']} requireApproval>
                    <ClientDashboard />
                  </ProtectedRoute>
                } />

                {/* Root - redirect based on role */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="/debug" element={<DebugPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
