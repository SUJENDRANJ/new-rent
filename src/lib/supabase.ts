import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_submitted_at?: string;
  kyc_document_url?: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Product = {
  id: string;
  host_id: string;
  category_id?: string;
  title: string;
  description: string;
  price_per_day: number;
  image_url?: string;
  location: string;
  location_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  categories?: Category;
};

export type Rental = {
  id: string;
  product_id: string;
  renter_id: string;
  host_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  products?: Product;
  renter?: Profile;
  host?: Profile;
};

export type Review = {
  id: string;
  product_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
};
