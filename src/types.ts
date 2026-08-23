export interface TechSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  subtitle: string;
  description: string;
  isBestSeller?: boolean;
  image: string;
  gallery?: string[];
  specs: string[];
  techSpecs?: TechSpec[];
  features?: string[];
  inTheBox?: string[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  description: string;
}

export interface ValueProp {
  id: string;
  title: string;
  subtitle: string;
  icon: 'shield' | 'zap' | 'award';
}

export interface QuoteFormData {
  productId?: string;
  productName?: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  quantity: number;
  message: string;
}

// 2. Database Schema Types according to requirements
export interface DbProduct {
  id: string; // uuid
  name: string; // text
  description: string; // text
  category: string; // text
  stock_quantity: number | null; // int4
  created_at?: string;
  updated_at?: string;
}

export interface DbQuoteRequest {
  id: string; // uuid
  customer_id: string; // uuid
  product_id: string | null; // uuid
  quantity: number; // int4
  status: string; // text (e.g. 'pending')
  notes: string | null; // text
  created_at?: string;
  updated_at?: string;
}

export interface DbCustomer {
  id: string; // uuid
  user_id?: string | null; // uuid
  name: string; // text
  email: string; // text
  phone: string; // text
  company?: string | null; // text
  address?: string | null; // text
  city?: string | null; // text
  state?: string | null; // text
  country?: string | null; // text
  created_at?: string;
  updated_at?: string;
}

export interface DbAdmin {
  id: string; // uuid
  username: string; // text
  email: string; // text
  password_hash: string; // text
  name: string; // text
  created_at?: string;
}
