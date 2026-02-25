import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { authApi } from '@/shared/auth';
import { PASSWORD_REQUIREMENTS, isPasswordValid } from '@/features/auth';
import { Button, PasswordInput } from '@/shared/ui';

export function meta() {
  return [
    { title: 'Set Password - Tinkersaur' },
    { name: 'description', content: 'Set your Tinkersaur password' },
  ];
}

export default function SetPasswordPage() {
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
      setError('Invalid setup link. Please contact your administrator.');
    }
  }, [email, token]);

  const passwordValid = isPasswordValid(password);
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Uses the same reset password endpoint
      await authApi.resetPassword(email, token, password);
      setSuccess(true);
    } catch {
      setError('Invalid or expired setup link. Please contact your administrator.');
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
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Password Set</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Your password has been set. You can now sign in.
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
          <h1 className="text-2xl font-bold text-[var(--text)]">Welcome to Tinkersaur!</h1>
          <p className="text-[var(--text-muted)] mt-2">
            Please set your password to complete account setup
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-2">
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              error={!!error && !passwordValid}
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
              placeholder="Confirm your password"
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
            disabled={loading || !email || !token || !passwordValid || !doPasswordsMatch}
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Already have a password? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
