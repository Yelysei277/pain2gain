export interface SourcesRow {
  id: number;
  subreddit: string | null;
  url: string | null;
  created_at: string;
}

export interface IdeasRow {
  id: number;
  title: string;
  elevator_pitch: string | null;
  pain_point: string | null;
  topic: string | null;
  score: number | null;
  source_id: number | null;
  created_at: string;
}

export interface SubscriptionsRow {
  id: number;
  user_id: string | null;
  email: string | null;
  topics: string[] | null;
  is_active: boolean | null;
  unsubscribe_token: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: SourcesRow;
        Insert: Omit<SourcesRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SourcesRow, 'id' | 'created_at'>>;
        Relationships: never[];
      };
      ideas: {
        Row: IdeasRow;
        Insert: Omit<IdeasRow, 'id' | 'created_at'>;
        Update: Partial<Omit<IdeasRow, 'id' | 'created_at'>>;
        Relationships: Array<{
          foreignKeyName: 'ideas_source_id_fkey';
          columns: ['source_id'];
          referencedRelation: 'sources';
          referencedColumns: ['id'];
        }>;
      };
      subscriptions: {
        Row: SubscriptionsRow;
        Insert: Omit<SubscriptionsRow, 'id' | 'created_at'>;
        Update: Partial<Omit<SubscriptionsRow, 'id' | 'created_at'>>;
        Relationships: never[];
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
  };
}
