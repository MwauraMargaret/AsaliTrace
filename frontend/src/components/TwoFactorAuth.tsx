import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

const TwoFactorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorsEnabled, setFactorsEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      // Check if 2FA is already enabled
      // This would require a backend endpoint to check 2FA status
      // For now, we'll assume it's disabled
      setFactorsEnabled(false);
    } catch (error) {
      // Silently fail - assume 2FA is not enabled
      setFactorsEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const enrollMFA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/setup/');
      
      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
        setSecret(response.data.secret || null);
        toast.success('2FA Setup Started', {
          description: 'Scan the QR code with your authenticator app',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          'Failed to setup 2FA. Please try again.';
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (code: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/verify-setup/', {
        token: code,
      });

      if (response.data.success) {
        setFactorsEnabled(true);
        setQrCode(null);
        setSecret(null);
        toast.success('2FA Enabled', {
          description: 'Two-factor authentication is now active',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          'Verification failed. Please check your code and try again.';
      toast.error('Verification Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {factorsEnabled ? (
          <Alert className="border-accent bg-accent/10">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              2FA is enabled and protecting your account
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {!qrCode ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enable 2FA to require a time-based code from your authenticator app when signing in.
                  </AlertDescription>
                </Alert>
                <Button onClick={enrollMFA} disabled={loading} variant="honey" className="w-full">
                  {loading ? 'Setting up...' : 'Enable 2FA'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </AlertDescription>
                </Alert>

                {qrCode && (
                  <div className="flex justify-center p-4 bg-card rounded-lg">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}

                {secret && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Manual Entry Code:</p>
                    <code className="block p-3 bg-muted rounded-lg text-sm break-all">
                      {secret}
                    </code>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your app to complete setup:
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full p-3 border border-border rounded-lg text-center text-2xl tracking-widest"
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (value.length === 6) {
                        verifyAndEnable(value);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
