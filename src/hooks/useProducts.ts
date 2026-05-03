import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { products as staticProducts } from '@/data/products';

export interface DbProduct {
  id: number;
  name: string;
  name_en: string;
  price: number;
  category: 'warhammer40k' | 'ageofsigmar' | 'killteam';
  image_url: string | null;
  description: string[];
  description_en: string[];
  material: string;
  type: string;
  stock: number;
}

export function useProducts(category?: string | null, search?: string) {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('id');

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to static data
      const fallback = staticProducts
        .filter((p) => !category || p.category === category)
        .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
        .map((p) => ({
          id: p.id,
          name: p.name,
          name_en: p.nameEn,
          price: p.price,
          category: p.category as DbProduct['category'],
          image_url: p.imageUrl as string,
          description: p.description,
          description_en: p.descriptionEn,
          material: p.material,
          type: p.type,
          stock: p.stock,
        }));
      setProducts(fallback);
    } else {
      setProducts(
        data.map((p) => ({
          ...p,
          category: p.category as DbProduct['category'],
          description: Array.isArray(p.description) ? (p.description as string[]) : [],
          description_en: Array.isArray(p.description_en) ? (p.description_en as string[]) : [],
        }))
      );
    }
    setLoading(false);
  };

  return { products, loading, refetch: fetchProducts };
}

export function useAdminProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id');
    if (data) {
      setProducts(
        data.map((p) => ({
          ...p,
          category: p.category as DbProduct['category'],
          description: Array.isArray(p.description) ? (p.description as string[]) : [],
          description_en: Array.isArray(p.description_en) ? (p.description_en as string[]) : [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  return { products, loading, refetch: fetchAll };
}
