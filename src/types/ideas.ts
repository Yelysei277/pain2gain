export interface ProductIdea {
  title: string;
  elevatorPitch: string;
  painPoint: string;
  topic: 'devtools' | 'health' | 'education' | 'finance' | 'business' | 'other';
  score: number;
  source: { subreddit: string; url?: string };
  createdAt?: string;
  isNew?: boolean;
}

