-- Milestone setup: final grants, storage, coupons, and storefront seed data.

-- Keep has_role callable for authenticated admin flows and anon public reads that
-- reference has_role() in RLS policy expressions.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- Supabase Storage bucket for future admin product image uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product images admin insert" ON storage.objects;
CREATE POLICY "product images admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
CREATE POLICY "product images admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;
CREATE POLICY "product images admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- App-visible coupon used by the checkout screen.
INSERT INTO public.coupons (code, type, value, min_order, usage_limit, is_active)
VALUES ('NOIR10', 'percent', 10, 0, NULL, true)
ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  min_order = EXCLUDED.min_order,
  usage_limit = EXCLUDED.usage_limit,
  is_active = EXCLUDED.is_active;

-- Taxonomy.
INSERT INTO public.categories (slug, name, description)
VALUES
  ('extrait-de-parfum', 'Extrait de Parfum', 'High-concentration compositions with long, cinematic wear.'),
  ('eau-de-parfum', 'Eau de Parfum', 'Polished daily signatures with depth and lift.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.fragrance_families (slug, name, description)
VALUES
  ('amber', 'Amber', 'Resins, smoke, vanilla, and warm mineral glow.'),
  ('floral', 'Floral', 'Petals, powder, silk, and luminous musks.'),
  ('woody', 'Woody', 'Vetiver, cedar, sandalwood, incense, and polished darkness.'),
  ('aquatic', 'Aquatic', 'Rain, vapor, mineral air, and translucent woods.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.brands (slug, name, tagline, story, hero_image)
VALUES
  ('venere', 'VÉNÉRÉ', 'Parisian extrait, cut in shadow.', 'The house signature: theatrical silhouettes, tactile resins, and a disciplined Parisian finish.', '/images/hero-obscura.jpg'),
  ('atelier-noir', 'Atelier Noir', 'Smoke, skin, velvet.', 'A nocturnal atelier devoted to intimate woods and restrained animalic warmth.', '/images/philosophy.jpg'),
  ('maison-obscura', 'Maison Obscura', 'Florals after midnight.', 'A maison of dark petals, polished musks, and rain-lit glass.', '/images/journal-1.jpg')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  story = EXCLUDED.story,
  hero_image = EXCLUDED.hero_image;

INSERT INTO public.collections (slug, name, description, hero_image, is_featured, sort_order)
VALUES
  ('noir-series', 'Noir Series', 'Black-tie signatures built around smoke, amber, and lacquered woods.', '/images/hero-obscura.jpg', true, 10),
  ('rose-after-dark', 'Rose After Dark', 'Petals, ink, powder, and the slow warmth of skin.', '/images/bottle-rose.jpg', true, 20),
  ('mineral-light', 'Mineral Light', 'Rain-washed woods and transparent musks for daylight restraint.', '/images/bottle-humid.jpg', false, 30),
  ('resin-library', 'Resin Library', 'Amber, labdanum, benzoin, and incense in collectible concentration.', '/images/bottle-resin.jpg', true, 40)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  hero_image = EXCLUDED.hero_image,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

-- Products.
INSERT INTO public.products (
  slug, name, brand_id, category_id, family_id, gender, tagline, description,
  top_notes, heart_notes, base_notes, is_featured, is_new, is_best_seller, is_active
)
VALUES
  (
    'obsidian-veil',
    'Obsidian Veil',
    (SELECT id FROM public.brands WHERE slug = 'venere'),
    (SELECT id FROM public.categories WHERE slug = 'extrait-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'amber'),
    'unisex',
    'A black amber suspended in silk smoke.',
    'Bergamot sparks through saffron before labdanum, smoked vanilla, and sandalwood pull the composition into a cinematic close.',
    ARRAY['bergamot', 'saffron', 'black pepper'],
    ARRAY['labdanum', 'orris', 'smoked tea'],
    ARRAY['vanilla resin', 'sandalwood', 'ambergris'],
    true,
    true,
    true,
    true
  ),
  (
    'rose-cendre',
    'Rose Cendre',
    (SELECT id FROM public.brands WHERE slug = 'maison-obscura'),
    (SELECT id FROM public.categories WHERE slug = 'eau-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'floral'),
    'unisex',
    'Damask rose beneath a trace of ash.',
    'A nocturnal rose polished with pink pepper, incense, suede, and soft musk.',
    ARRAY['pink pepper', 'raspberry leaf', 'bergamot'],
    ARRAY['damask rose', 'incense', 'iris'],
    ARRAY['suede', 'musk', 'cedar'],
    true,
    false,
    true,
    true
  ),
  (
    'vetiver-minuit',
    'Vetiver Minuit',
    (SELECT id FROM public.brands WHERE slug = 'atelier-noir'),
    (SELECT id FROM public.categories WHERE slug = 'extrait-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'woody'),
    'masculine',
    'Cold vetiver, tailored smoke.',
    'Grapefruit and juniper cut through Haitian vetiver, cedar, birch smoke, and mineral musk.',
    ARRAY['grapefruit', 'juniper', 'angelica'],
    ARRAY['haitian vetiver', 'cedar', 'violet leaf'],
    ARRAY['birch smoke', 'mineral musk', 'patchouli'],
    true,
    false,
    false,
    true
  ),
  (
    'amber-apparition',
    'Amber Apparition',
    (SELECT id FROM public.brands WHERE slug = 'venere'),
    (SELECT id FROM public.categories WHERE slug = 'extrait-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'amber'),
    'unisex',
    'Benzoin and gold through black glass.',
    'A resinous amber edit with mandarin peel, benzoin, tonka, and polished woods.',
    ARRAY['mandarin peel', 'cardamom', 'cinnamon'],
    ARRAY['benzoin', 'labdanum', 'tonka'],
    ARRAY['amberwood', 'vanilla', 'patchouli'],
    false,
    true,
    false,
    true
  ),
  (
    'humid-orchid',
    'Humid Orchid',
    (SELECT id FROM public.brands WHERE slug = 'maison-obscura'),
    (SELECT id FROM public.categories WHERE slug = 'eau-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'aquatic'),
    'feminine',
    'Rain on white petals.',
    'An airy floral aquatic with pear, wet orchid, tea, transparent woods, and musk.',
    ARRAY['pear skin', 'rain accord', 'green tea'],
    ARRAY['white orchid', 'jasmine mist', 'iris water'],
    ARRAY['clear musk', 'driftwood', 'ambrette'],
    false,
    true,
    false,
    true
  ),
  (
    'resin-archive',
    'Resin Archive',
    (SELECT id FROM public.brands WHERE slug = 'atelier-noir'),
    (SELECT id FROM public.categories WHERE slug = 'extrait-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'amber'),
    'unisex',
    'An old library of warm resins.',
    'Myrrh, olibanum, benzoin, and dark woods arranged with archival restraint.',
    ARRAY['clove', 'orange wax', 'black tea'],
    ARRAY['myrrh', 'olibanum', 'benzoin'],
    ARRAY['guaiac wood', 'amber', 'leather'],
    false,
    false,
    true,
    true
  ),
  (
    'sintered-musk',
    'Sintered Musk',
    (SELECT id FROM public.brands WHERE slug = 'venere'),
    (SELECT id FROM public.categories WHERE slug = 'eau-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'woody'),
    'unisex',
    'Clean metal, soft skin.',
    'A minimal skin scent of aldehydes, iris, clean musks, cedar, and cashmere wood.',
    ARRAY['aldehydes', 'bergamot', 'cold air'],
    ARRAY['iris', 'violet', 'rice powder'],
    ARRAY['white musk', 'cedar', 'cashmere wood'],
    false,
    false,
    false,
    true
  ),
  (
    'noir-bottle',
    'Noir Bottle',
    (SELECT id FROM public.brands WHERE slug = 'atelier-noir'),
    (SELECT id FROM public.categories WHERE slug = 'extrait-de-parfum'),
    (SELECT id FROM public.fragrance_families WHERE slug = 'woody'),
    'unisex',
    'Ink, cedar, and candle smoke.',
    'A stark composition of black pepper, ink accord, cedar, incense, and dry amber.',
    ARRAY['black pepper', 'elemi', 'ink accord'],
    ARRAY['cedar', 'incense', 'cypress'],
    ARRAY['dry amber', 'vetiver', 'musk'],
    true,
    false,
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  brand_id = EXCLUDED.brand_id,
  category_id = EXCLUDED.category_id,
  family_id = EXCLUDED.family_id,
  gender = EXCLUDED.gender,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  top_notes = EXCLUDED.top_notes,
  heart_notes = EXCLUDED.heart_notes,
  base_notes = EXCLUDED.base_notes,
  is_featured = EXCLUDED.is_featured,
  is_new = EXCLUDED.is_new,
  is_best_seller = EXCLUDED.is_best_seller,
  is_active = EXCLUDED.is_active;

-- Variants.
INSERT INTO public.product_variants (product_id, volume_ml, price, discount_price, stock, sku, low_stock_threshold)
SELECT p.id, v.volume_ml, v.price, v.discount_price, v.stock, v.sku, 5
FROM public.products p
JOIN (
  VALUES
    ('obsidian-veil', 30, 145.00, NULL::numeric, 18, 'VEN-OBS-030'),
    ('obsidian-veil', 50, 210.00, 189.00, 12, 'VEN-OBS-050'),
    ('obsidian-veil', 100, 360.00, NULL::numeric, 6, 'VEN-OBS-100'),
    ('rose-cendre', 30, 125.00, NULL::numeric, 20, 'OBS-ROS-030'),
    ('rose-cendre', 50, 185.00, NULL::numeric, 11, 'OBS-ROS-050'),
    ('rose-cendre', 100, 320.00, 288.00, 4, 'OBS-ROS-100'),
    ('vetiver-minuit', 30, 135.00, NULL::numeric, 15, 'ATN-VET-030'),
    ('vetiver-minuit', 50, 198.00, NULL::numeric, 9, 'ATN-VET-050'),
    ('vetiver-minuit', 100, 340.00, NULL::numeric, 5, 'ATN-VET-100'),
    ('amber-apparition', 30, 138.00, NULL::numeric, 16, 'VEN-AMB-030'),
    ('amber-apparition', 50, 205.00, NULL::numeric, 10, 'VEN-AMB-050'),
    ('amber-apparition', 100, 355.00, NULL::numeric, 5, 'VEN-AMB-100'),
    ('humid-orchid', 30, 118.00, NULL::numeric, 22, 'OBS-HUM-030'),
    ('humid-orchid', 50, 172.00, NULL::numeric, 14, 'OBS-HUM-050'),
    ('humid-orchid', 100, 298.00, NULL::numeric, 7, 'OBS-HUM-100'),
    ('resin-archive', 30, 148.00, NULL::numeric, 12, 'ATN-RES-030'),
    ('resin-archive', 50, 218.00, NULL::numeric, 8, 'ATN-RES-050'),
    ('resin-archive', 100, 372.00, NULL::numeric, 3, 'ATN-RES-100'),
    ('sintered-musk', 30, 112.00, NULL::numeric, 20, 'VEN-SIN-030'),
    ('sintered-musk', 50, 165.00, NULL::numeric, 15, 'VEN-SIN-050'),
    ('sintered-musk', 100, 285.00, NULL::numeric, 9, 'VEN-SIN-100'),
    ('noir-bottle', 30, 140.00, NULL::numeric, 14, 'ATN-NOI-030'),
    ('noir-bottle', 50, 208.00, 188.00, 8, 'ATN-NOI-050'),
    ('noir-bottle', 100, 350.00, NULL::numeric, 4, 'ATN-NOI-100')
) AS v(slug, volume_ml, price, discount_price, stock, sku)
ON p.slug = v.slug
ON CONFLICT (product_id, volume_ml) DO UPDATE SET
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  stock = EXCLUDED.stock,
  sku = EXCLUDED.sku,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  is_active = true;

-- Product imagery uses bundled public assets today; admin uploads can later use the storage bucket.
INSERT INTO public.product_images (product_id, url, alt, sort_order, is_primary)
SELECT p.id, i.url, i.alt, 0, true
FROM public.products p
JOIN (
  VALUES
    ('obsidian-veil', '/images/hero-obscura.jpg', 'Obsidian Veil bottle in noir light'),
    ('rose-cendre', '/images/bottle-rose.jpg', 'Rose Cendre perfume bottle'),
    ('vetiver-minuit', '/images/bottle-vetiver.jpg', 'Vetiver Minuit perfume bottle'),
    ('amber-apparition', '/images/bottle-amber.jpg', 'Amber Apparition perfume bottle'),
    ('humid-orchid', '/images/bottle-humid.jpg', 'Humid Orchid perfume bottle'),
    ('resin-archive', '/images/bottle-resin.jpg', 'Resin Archive perfume bottle'),
    ('sintered-musk', '/images/bottle-sintered.jpg', 'Sintered Musk perfume bottle'),
    ('noir-bottle', '/images/bottle-noir.jpg', 'Noir Bottle perfume bottle')
) AS i(slug, url, alt)
ON p.slug = i.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_images existing
  WHERE existing.product_id = p.id
  AND existing.url = i.url
);

-- Collection memberships.
INSERT INTO public.product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM (
  VALUES
    ('obsidian-veil', 'noir-series'),
    ('obsidian-veil', 'resin-library'),
    ('rose-cendre', 'rose-after-dark'),
    ('vetiver-minuit', 'noir-series'),
    ('amber-apparition', 'resin-library'),
    ('humid-orchid', 'mineral-light'),
    ('resin-archive', 'resin-library'),
    ('sintered-musk', 'mineral-light'),
    ('noir-bottle', 'noir-series')
) AS pc(product_slug, collection_slug)
JOIN public.products p ON p.slug = pc.product_slug
JOIN public.collections c ON c.slug = pc.collection_slug
ON CONFLICT (product_id, collection_id) DO NOTHING;
