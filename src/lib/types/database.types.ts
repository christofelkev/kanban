export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          position: number;
          created_at: string;
          wip_limit?: number | null;
          color?: string | null;
          is_collapsed?: boolean | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          position?: number;
          created_at?: string;
          wip_limit?: number | null;
          color?: string | null;
          is_collapsed?: boolean | null;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
          wip_limit?: number | null;
          color?: string | null;
          is_collapsed?: boolean | null;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          list_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
          archived_at?: string | null;
        };
        Insert: {
          id?: string;
          list_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          list_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      card_labels: {
        Row: {
          card_id: string;
          label_id: string;
        };
        Insert: {
          card_id: string;
          label_id: string;
        };
        Update: {
          card_id?: string;
          label_id?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
