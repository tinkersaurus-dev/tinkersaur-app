export interface PasswordRequirement {
  test: (password: string) => boolean;
  label: string;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: 'One special character' },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every(req => req.test(password));
}
