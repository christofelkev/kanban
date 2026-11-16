import type { Database } from './database.types';

export type BoardRow = Database['public']['Tables']['boards']['Row'];
export type BoardInsert = Database['public']['Tables']['boards']['Insert'];
export type BoardUpdate = Database['public']['Tables']['boards']['Update'];

export type ListRow = Database['public']['Tables']['lists']['Row'];
export type ListInsert = Database['public']['Tables']['lists']['Insert'];
export type ListUpdate = Database['public']['Tables']['lists']['Update'];

export type CardRow = Database['public']['Tables']['cards']['Row'];
export type CardInsert = Database['public']['Tables']['cards']['Insert'];
export type CardUpdate = Database['public']['Tables']['cards']['Update'];

export type LabelRow = Database['public']['Tables']['labels']['Row'];
export type LabelInsert = Database['public']['Tables']['labels']['Insert'];
export type LabelUpdate = Database['public']['Tables']['labels']['Update'];

export type CommentRow = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export interface KanbanCard extends CardRow {
  labels: LabelRow[];
  commentsCount?: number;
}

export interface KanbanColumn extends ListRow {
  items: KanbanCard[];
}

export interface KanbanBoard extends BoardRow {
  columns: KanbanColumn[];
}

export type DueDateStatus = 'normal' | 'warning' | 'overdue' | null;
