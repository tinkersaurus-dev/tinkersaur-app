import { useState } from 'react';
import { authApi, useAuthStore, PASSWORD_REQUIREMENTS, isPasswordValid } from '@/features/auth';
import { Button, Modal, PasswordInput } from '@/shared/ui';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  forced?: boolean; // If true, user must change password and cannot dismiss
}

export function ChangePasswordModal({ open, onClose, forced = false }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearMustChangePassword = useAuthStore((state) => state.clearMustChangePassword);

  const passwordValid = isPasswordValid(newPassword);
  const doPasswordsMatch = newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!passwordValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      clearMustChangePassword();
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Close after a brief delay to show success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setError('Current password is incorrect or new password does not meet requirements.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!forced) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={forced ? 'Password Change Required' : 'Change Password'}
      footer={null}
      closable={!forced}
    >
      {success ? (
        <div className="text-center py-4">
          <div className="mb-4">
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
          <p className="text-[var(--text)]">Password changed successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {forced && (
            <p className="text-sm text-[var(--text-muted)] mb-4">
              You must change your password before continuing.
            </p>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
              Current Password
            </label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              error={!!newPassword && !passwordValid}
            />
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirmNewPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              error={!!confirmPassword && !doPasswordsMatch}
            />
            {confirmPassword && !doPasswordsMatch && (
              <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Password requirements checklist */}
          <div className="bg-[var(--bg-secondary)] p-3 rounded-md">
            <p className="text-xs font-medium text-[var(--text)] mb-2">Password requirements:</p>
            <ul className="space-y-0.5">
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <li key={index} className="flex items-center text-xs">
                  <span className={`mr-2 ${req.test(newPassword) ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                    {req.test(newPassword) ? '✓' : '○'}
                  </span>
                  <span className={req.test(newPassword) ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            {!forced && (
              <Button
                type="button"
                variant="default"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !passwordValid || !doPasswordsMatch || !currentPassword}
              className="flex-1"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
