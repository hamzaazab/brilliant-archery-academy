export interface Tournament {
  id: number;
  title: string;
  type: string;
  date: string;
  location: string;
  summary: string;
  description: string;
  images: string[];
  accent?: 'amber' | 'blue' | string;
}
