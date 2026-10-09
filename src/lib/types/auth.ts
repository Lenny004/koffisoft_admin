export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  status: string;
  passwordChangedAt?: string | null;
  emailVerifiedAt?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

export interface AuthSnapshot {
  user: AuthenticatedUser;
  roles: string[];
  permissions: string[];
  mfa: {
    enabled?: boolean;
    required?: boolean;
    verified?: boolean;
    [key: string]: unknown;
  };
}

export function displayUserName(user: AuthenticatedUser): string {
  return user.username || user.email.split('@')[0] || 'Usuario';
}

export function needsPasswordChange(user: AuthenticatedUser | undefined): boolean {
  return user?.mustChangePassword === true || user?.passwordChangeRequired === true;
}
