import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import PendingApproval from "@/pages/PendingApproval";

// Dashboard Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import ClientDashboard from "@/pages/client/Dashboard";
import WorkerDashboard from "@/pages/worker/Dashboard";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function RoleBasedRedirect() {
  const { role, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Pending Approval */}
            <Route path="/pending-approval" element={
              <ProtectedRoute allowedRoles={['client']}>
                <PendingApproval />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
