import { useState } from 'react';
import { Link } from 'react-router';
import { authApi } from '~/core/auth/authApi';
import { Button, Input } from '~/core/components/ui';

export function meta() {
  return [
    { title: 'Forgot Password - Tinkersaur' },
    { name: 'description', content: 'Reset your Tinkersaur password' },
  ];
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="w-full max-w-md p-8 bg-[var(--bg-primary)] rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Check your email</h1>
            <p className="text-[var(--text-muted)] mb-6">
              If an account exists for {email}, we&apos;ve sent a password reset link.
              Please check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="text-[var(--primary)] hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md p-8 bg-[var(--bg-primary)] rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Forgot Password</h1>
          <p className="text-[var(--text-muted)] mt-2">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              error={!!error}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
