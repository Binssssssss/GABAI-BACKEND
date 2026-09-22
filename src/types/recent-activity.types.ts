export type RecentActivityType =
  | "task"
  | "wallet"
  | "calendar"
  | "note"
  | "general";

export interface CreateRecentActivityInput {
  icon: string;
  text: string;
  type: RecentActivityType;
}

export interface RecentActivityResponse {
  id: string;
  icon: string;
  text: string;
  type: RecentActivityType;
  createdAt: Date;
}