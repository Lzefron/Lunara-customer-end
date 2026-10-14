export interface Photo { id: string; webp_path: string; thumb_path: string; kind?: 'catalog' | 'variant' | 'real'; label?: string }
export interface Product {
  id: string; name: string; sell_price: number; colors: string[]; available: boolean;
  photos: Photo[]; category: string; subcategory: string; description: string;
  featured: boolean; created_at: string; updated_at: string;
}
export interface Category { name: string; subcategories: string[] }
export interface Catalog { products: Product[]; categories: Category[] }
