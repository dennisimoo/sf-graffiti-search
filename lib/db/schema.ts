export interface DBImage {
  id: number;
  path: string;
  title: string;
  description: string;
  similarity?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  location?: string;
  originalComment?: string;
}
