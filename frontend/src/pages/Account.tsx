import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TwoFactorAuth from '@/components/TwoFactorAuth';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

const Account = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // ProtectedRoute already handles authentication, but add a safety check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to Home
              </Button>
              <h1 className="text-2xl font-bold">Account Settings</h1>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
          {/* Profile Picture Upload */}
          <ProfilePictureUpload />

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user?.email || 'No email'}</p>
                  <Badge variant="verified" className="mt-1">
                    Verified
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User ID</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {user?.id ? `${String(user.id).slice(0, 8)}...` : 'N/A'}
                  </code>
                </div>
                {(user as any).created_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Created</span>
                    <span>{new Date((user as any).created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <PasswordChangeForm />

          {/* 2FA Card */}
          <TwoFactorAuth />

          {/* Security Info */}
          <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-accent" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Enable 2FA for maximum account security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Use a strong, unique password</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Never share your authentication codes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Account page error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading account page</p>
          <p className="text-sm text-muted-foreground mt-2">{String(error)}</p>
        </div>
      </div>
    );
  }
};

export default Account;
