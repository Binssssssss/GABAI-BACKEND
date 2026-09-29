export type NoteType =
  | 'BLANK'
  | 'QUICK_JOT'
  | 'TEMPLATE';

export interface CreateNoteInput {
  title?: string;
  content?: string;
  type?: NoteType;
  category?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  type?: NoteType;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content?: string;
}

export interface NoteResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteFilterTab =
  | 'all'
  | 'pinned'
  | 'favorites'
  | 'archived';

  export type NoteSortOption =
  | "updated"
  | "created"
  | "title"
  | "category";

  
export interface NoteFilters {
  tab?: NoteFilterTab;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: NoteSortOption;
  sortOrder?: "asc" | "desc";
}

export interface NoteListResponse {
  notes: NoteResponse[];
  total: number;
}
