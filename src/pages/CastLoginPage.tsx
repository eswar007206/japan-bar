/**
 * Cast Login Page
 * Username + password authentication for cast members
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function CastLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useCastAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Auto-focus username field on mount
  useEffect(() => {
    usernameRef.current?.focus();
  }, [authLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await login(username.trim(), password);

    if (result.success) {
      navigate('/cast');
    } else {
      setError(result.error || 'ログインに失敗しました');
      setPassword('');
    }

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h1 className="text-2xl font-bold text-foreground">
              キャストログイン
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ユーザー名とパスワードを入力してください
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                ref={usernameRef}
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                disabled={isSubmitting}
                placeholder="ユーザー名"
              />
            </div>

            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                disabled={isSubmitting}
                placeholder="パスワード"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!username.trim() || !password.trim() || isSubmitting}
              className="w-full"
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
          </form>

          {/* Demo Info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-center text-xs text-muted-foreground">
              デモ用: さくら / 1234、ゆき / 2345、はな / 3456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
