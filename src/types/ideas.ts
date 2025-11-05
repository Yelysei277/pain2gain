export interface ProductIdea {
  title: string;
  elevatorPitch: string;
  painPoint: string;
  topic: 'devtools' | 'health' | 'education' | 'other';
  score: number;
  source: { subreddit: string; url?: string };
}


