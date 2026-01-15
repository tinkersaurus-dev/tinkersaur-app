import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { authApi } from '~/core/auth/authApi';
import { Button, PasswordInput } from '~/core/components/ui';

export function meta() {
  return [
    { title: 'Reset Password - Tinkersaur' },
    { name: 'description', content: 'Reset your Tinkersaur password' },
  ];
}

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: 'One special character' },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we have the required params
  useEffect(() => {
    if (!email || !token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [email, token]);

  const isPasswordValid = PASSWORD_REQUIREMENTS.every(req => req.test(password));
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, token, password);
      setSuccess(true);
    } catch {
      setError('Invalid or expired reset link. Please request a new password reset.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Password Reset</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Your password has been successfully reset.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md p-8 bg-[var(--bg-primary)] rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Reset Password</h1>
          <p className="text-[var(--text-muted)] mt-2">
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-2">
              New Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              error={!!error && !isPasswordValid}
              disabled={!email || !token}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              error={!!confirmPassword && !doPasswordsMatch}
              disabled={!email || !token}
            />
            {confirmPassword && !doPasswordsMatch && (
              <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Password requirements checklist */}
          <div className="bg-[var(--bg-secondary)] p-4 rounded-md">
            <p className="text-sm font-medium text-[var(--text)] mb-2">Password requirements:</p>
            <ul className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className={`mr-2 ${req.test(password) ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                    {req.test(password) ? '✓' : '○'}
                  </span>
                  <span className={req.test(password) ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading || !email || !token || !isPasswordValid || !doPasswordsMatch}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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
