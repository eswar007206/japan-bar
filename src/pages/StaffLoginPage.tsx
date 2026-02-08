/**
 * Staff Login Page
 * PIN-based authentication for staff members
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Shield } from 'lucide-react';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useStaffAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('4桁のPINを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await login(pin);
    
    if (result.success) {
      navigate('/staff/dashboard');
    } else {
      setError(result.error || 'ログインに失敗しました');
      setPin('');
    }
    
    setIsSubmitting(false);
  };

  const handlePinChange = (value: string) => {
    setPin(value);
    setError(null);
    
    if (value.length === 4) {
      setTimeout(() => {
        const submitBtn = document.getElementById('staff-pin-submit');
        submitBtn?.click();
      }, 100);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              スタッフログイン
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              管理者PINを入力してください
            </p>
          </div>

          {/* PIN Input */}
          <div className="flex flex-col items-center space-y-6">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              disabled={isSubmitting}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-14 text-2xl" />
                <InputOTPSlot index={1} className="h-14 w-14 text-2xl" />
                <InputOTPSlot index={2} className="h-14 w-14 text-2xl" />
                <InputOTPSlot index={3} className="h-14 w-14 text-2xl" />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              id="staff-pin-submit"
              onClick={handleSubmit}
              disabled={pin.length !== 4 || isSubmitting}
              className="w-full"
              variant="secondary"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  確認中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </div>

          {/* Demo Info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-center text-xs text-muted-foreground">
              デモ用PIN: 0000（管理者）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
