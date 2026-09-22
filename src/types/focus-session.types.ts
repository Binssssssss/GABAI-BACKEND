export type FocusSessionStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface StartFocusSessionInput {
  duration?: number;
  targetHours?: number;
}

export interface FocusSessionResponse {
  id: string;
  duration: number;
  remainingTime: number;
  targetHours: number;
  status: FocusSessionStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}