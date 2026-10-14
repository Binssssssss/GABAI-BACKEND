export interface UserData {
  fullName: string;
  email: string;
  password: string;
  firebaseUid?: string;
  emailVerified?: boolean;
  emailVerificationCode?: string | null;
  emailVerificationExpires?: Date | null;
  emailVerificationAttempts?: number;
  emailVerificationSentAt?: Date | null;
}