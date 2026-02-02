import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import microsunLogo from '@/assets/microsun-logo.webp';

export default function PendingApproval() {
  const { profile, signOut, refreshProfile, isApproved } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRefresh = async () => {
    await refreshProfile();
    if (isApproved) {
      navigate('/client');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={microsunLogo} alt="MicroSun" className="h-12 w-auto" />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-warning/10 p-4">
              <Clock className="h-12 w-12 text-warning" />
            </div>
          </div>
          <CardTitle className="text-2xl">Awaiting Approval</CardTitle>
          <CardDescription className="text-base">
            Hi {profile?.full_name}, your account is pending approval from the administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be able to browse products and place orders once your account is approved.
            This usually takes 1-2 business days.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </Button>
            <Button onClick={handleSignOut} variant="ghost" className="w-full text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
