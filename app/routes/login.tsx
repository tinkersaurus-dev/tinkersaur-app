import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '~/core/auth';
import { Button, Input } from '~/core/components/ui';

export function meta() {
  return [
    { title: 'Login - Tinkersaur' },
    { name: 'description', content: 'Login to Tinkersaur' },
  ];
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    try {
      await login(email);
      navigate('/discovery');
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setError('No user found with this email');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md p-8 bg-[var(--bg-primary)] rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Tinkersaur</h1>
          <p className="text-[var(--text-muted)] mt-2">Sign in with your email</p>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
