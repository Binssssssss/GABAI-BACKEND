export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  /** Profile photo as a data URL, or null when the user has none. */
  avatar?: string | null;
  /** "email" (own password) or "google" (password managed by Google). */
  authProvider?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}