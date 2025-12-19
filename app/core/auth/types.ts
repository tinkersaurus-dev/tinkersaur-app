export type TeamRole = 'Edit' | 'View';

export interface TeamAccess {
  teamId: string;
  teamName: string;
  role: TeamRole;
  isPrimary: boolean;
}

export interface SelectedTeam {
  teamId: string;
  teamName: string;
  canEdit: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface TeamAccessResponse {
  userId: string;
  email: string;
  name: string;
  primaryTeamId: string;
  teamAccess: TeamAccess[];
}
