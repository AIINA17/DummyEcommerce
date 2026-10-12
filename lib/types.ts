export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  stock: number;
  image_url: string;
  store_id: number | null;
  store?: Store;
  reviews?: ProductReview[];
}

export interface Store {
  id: number;
  name: string;
  city: string;
  address: string;
  created_at: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  products: Product;
}

export interface UserData {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  balance: number;
  created_at?: string;
}

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  name_snapshot: string;
}

export interface Order {
  id: number;
  user_id: number;
  payment_method: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[];
}
