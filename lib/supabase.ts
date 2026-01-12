import { createClient } from "@supabase/supabase-js";

// Ambil dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client untuk digunakan di frontend (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  stock: number;
  image_url: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  products?: Product;
}