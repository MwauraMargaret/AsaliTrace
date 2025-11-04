import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
//import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TwoFactorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorsEnabled, setFactorsEnabled] = useState(false);
  const { toast } = useToast();

  const enrollMFA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        toast({
          title: "2FA Setup Started",
          description: "Scan the QR code with your authenticator app",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (code: string) => {
    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data && factors.data.totp.length > 0) {
        const factorId = factors.data.totp[0].id;

        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code,
        });

        if (error) throw error;

        setFactorsEnabled(true);
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication is now active",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
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
