export type Variant = {
  id: string;
  volume_ml: number;
  price: number;
  discount_price: number | null;
  stock: number;
  sku: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  family_name: string | null;
  family_slug: string | null;
  gender: "feminine" | "masculine" | "unisex";
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  primary_image: string | null;
  primary_alt: string | null;
  min_price: number;
  min_discount_price: number | null;
  total_stock: number;
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  images: ProductImage[];
  variants: Variant[];
};

export type Brand = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  story: string | null;
  hero_image: string | null;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hero_image: string | null;
  is_featured: boolean;
};

export type FragranceFamily = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};
