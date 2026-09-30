export type FocusSessionStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type AmbientSound =
  | "NONE"
  | "RAIN"
  | "LIBRARY"
  | "CAFE"
  | "WAVES"
  | "WHITENOISE";

export type FocusMode =
  | "pomodoro"
  | "deepWork"
  | "shortBreak"
  | "longBreak"
  | "custom";

export interface StartFocusSessionInput {
  duration?: number;
  targetHours?: number;
  ambientSound?: AmbientSound | string;
  isStrict?: boolean;
  subject?: string;
  focusMode?: FocusMode | string;
}

export interface UpdateAmbientSoundInput {
  ambientSound: AmbientSound | string;
}

export interface UpdateStrictModeInput {
  isStrict: boolean;
}

export interface FocusSessionResponse {
  id: string;
  duration: number;
  remainingTime: number;
  targetHours: number;
  status: FocusSessionStatus;
  ambientSound: AmbientSound;
  isStrict: boolean;
  subject: string | null;
  focusMode: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}

export interface FocusSessionRecord {
  id: string;
  subject: string;
  durationMinutes: number;
  mode: FocusMode;
  completedAt: string;
  isStrict: boolean;
}

export interface FocusStats {
  todayMinutes: number;
  todaySessions: number;
  streakDays: number;
  totalHours: number;
}