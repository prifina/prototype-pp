import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';

interface PasscodeGateProps {
  onSuccess: (production: { id: string; name: string }) => void;
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ onSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - replace with actual backend call
      if (passcode === 'DEMO123') {
        onSuccess({ id: 'demo-production-id', name: 'Demo Production' });
      } else {
        setAttempts(prev => prev + 1);
        if (attempts >= 2) {
          setError('Too many failed attempts. Please wait 10 minutes before trying again.');
        } else {
          setError('Invalid passcode. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = attempts >= 3;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Enter Production Passcode</CardTitle>
        <CardDescription>
          Enter the passcode provided by your production team to begin onboarding
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.toUpperCase())}
              placeholder="Enter your passcode"
              disabled={isLoading || isLocked}
              maxLength={12}
              className="text-center font-mono tracking-wider"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!passcode || isLoading || isLocked}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo passcode: <span className="font-mono">DEMO123</span></p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};