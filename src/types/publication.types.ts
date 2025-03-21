export interface Publication {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  category_id?: string;
  subcategory_id?: string;
  user_id: string;
  status: 'active' | 'inactive' | 'sold';
  created_at: string;
  updated_at: string;
  images?: string[];
  location?: {
    city?: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export type CreatePublicationDto = Omit<Publication, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePublicationDto = Partial<CreatePublicationDto>; 