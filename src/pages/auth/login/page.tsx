import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '@/shared/auth';
import { Button, Input, PasswordInput } from '@/shared/ui';

export function meta() {
  return [
    { title: 'Login - Tinkersaur' },
    { name: 'description', content: 'Login to Tinkersaur' },
  ];
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      await login(email, password);
      navigate('/solutions/strategy/overview');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          setError('Invalid email or password');
        } else if (err.message.includes('423')) {
          setError('Account is locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.');
        } else if (err.message.includes('404')) {
          setError('Invalid email or password');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)]">
      <div className="w-full max-w-md p-8 bg-[var(--bg)] rounded-lg shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Tinkersaur</h1>
          <p className="text-[var(--text-muted)] mt-2">Sign in to your account</p>
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
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-2">
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              error={!!error}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
