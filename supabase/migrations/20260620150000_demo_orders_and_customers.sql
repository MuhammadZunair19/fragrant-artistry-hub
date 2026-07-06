-- Demo customers, orders, and order lines for admin overview + orders pages.
-- Safe to re-run: uses fixed UUIDs / order numbers with conflict handling.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Demo shoppers (password: VenereDemo2026! — for local testing only)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'elena.marchand@example.com',
    crypt('VenereDemo2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Elena Marchand"}'::jsonb,
    timezone('utc', now()) - interval '120 days',
    timezone('utc', now()),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'james.whitfield@example.com',
    crypt('VenereDemo2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"James Whitfield"}'::jsonb,
    timezone('utc', now()) - interval '95 days',
    timezone('utc', now()),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'sofia.alarcon@example.com',
    crypt('VenereDemo2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sofia Alarcón"}'::jsonb,
    timezone('utc', now()) - interval '60 days',
    timezone('utc', now()),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a1000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'lucas.bernheim@example.com',
    crypt('VenereDemo2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Lucas Bernheim"}'::jsonb,
    timezone('utc', now()) - interval '45 days',
    timezone('utc', now()),
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
FROM auth.users u
WHERE u.id IN (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000004'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id AND i.provider = 'email'
);

UPDATE public.profiles SET
  full_name = 'Elena Marchand',
  phone = '+33 6 12 34 56 01'
WHERE id = 'a1000000-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'James Whitfield',
  phone = '+1 212 555 0142'
WHERE id = 'a1000000-0000-4000-8000-000000000002';

UPDATE public.profiles SET
  full_name = 'Sofia Alarcón',
  phone = '+34 612 345 678'
WHERE id = 'a1000000-0000-4000-8000-000000000003';

UPDATE public.profiles SET
  full_name = 'Lucas Bernheim',
  phone = '+41 79 123 45 67'
WHERE id = 'a1000000-0000-4000-8000-000000000004';

INSERT INTO public.addresses (
  id, user_id, label, full_name, line1, line2, city, region, postal_code, country, phone, is_default
)
VALUES
  (
    'c3000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'Paris',
    'Elena Marchand',
    '14 Rue de la Paix',
    NULL,
    'Paris',
    'Île-de-France',
    '75002',
    'France',
    '+33 6 12 34 56 01',
    true
  ),
  (
    'c3000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'Home',
    'James Whitfield',
    '220 Hudson Street',
    'Apt 8B',
    'New York',
    'NY',
    '10013',
    'United States',
    '+1 212 555 0142',
    true
  ),
  (
    'c3000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'Madrid',
    'Sofia Alarcón',
    'Calle de Serrano 45',
    NULL,
    'Madrid',
    'Madrid',
    '28001',
    'Spain',
    '+34 612 345 678',
    true
  ),
  (
    'c3000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000004',
    'Zürich',
    'Lucas Bernheim',
    'Bahnhofstrasse 31',
    NULL,
    'Zürich',
    'ZH',
    '8001',
    'Switzerland',
    '+41 79 123 45 67',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Orders (spread across the last 14 days for the overview chart)
INSERT INTO public.orders (
  id,
  order_number,
  user_id,
  status,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  coupon_code,
  shipping_address,
  billing_address,
  customer_email,
  created_at
)
VALUES
  (
    'b2000000-0000-4000-8000-000000000001',
    'VR-DEMO0001',
    'a1000000-0000-4000-8000-000000000001',
    'delivered',
    189.00, 0, 18.00, 15.59, 222.59,
    NULL,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    'elena.marchand@example.com',
    timezone('utc', now()) - interval '13 days' + interval '10 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'VR-DEMO0002',
    'a1000000-0000-4000-8000-000000000002',
    'delivered',
    260.00, 0, 18.00, 21.45, 299.45,
    NULL,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    'james.whitfield@example.com',
    timezone('utc', now()) - interval '12 days' + interval '14 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000003',
    'VR-DEMO0003',
    'a1000000-0000-4000-8000-000000000003',
    'shipped',
    205.00, 0, 18.00, 16.91, 239.91,
    NULL,
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    'sofia.alarcon@example.com',
    timezone('utc', now()) - interval '11 days' + interval '9 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000004',
    'VR-DEMO0004',
    'a1000000-0000-4000-8000-000000000004',
    'processing',
    280.00, 0, 18.00, 23.10, 321.10,
    NULL,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    'lucas.bernheim@example.com',
    timezone('utc', now()) - interval '10 days' + interval '16 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000005',
    'VR-DEMO0005',
    'a1000000-0000-4000-8000-000000000001',
    'confirmed',
    172.00, 0, 18.00, 14.19, 204.19,
    NULL,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    'elena.marchand@example.com',
    timezone('utc', now()) - interval '9 days' + interval '11 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000006',
    'VR-DEMO0006',
    'a1000000-0000-4000-8000-000000000002',
    'delivered',
    360.00, 0, 0, 29.70, 389.70,
    NULL,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    'james.whitfield@example.com',
    timezone('utc', now()) - interval '8 days' + interval '13 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000007',
    'VR-DEMO0007',
    'a1000000-0000-4000-8000-000000000003',
    'delivered',
    250.00, 0, 18.00, 20.63, 288.63,
    NULL,
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    'sofia.alarcon@example.com',
    timezone('utc', now()) - interval '7 days' + interval '15 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000008',
    'VR-DEMO0008',
    'a1000000-0000-4000-8000-000000000004',
    'shipped',
    198.00, 0, 18.00, 16.34, 232.34,
    NULL,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    'lucas.bernheim@example.com',
    timezone('utc', now()) - interval '6 days' + interval '10 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000009',
    'VR-DEMO0009',
    'a1000000-0000-4000-8000-000000000001',
    'pending',
    185.00, 0, 18.00, 15.26, 218.26,
    NULL,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    '{"full_name":"Elena Marchand","line1":"14 Rue de la Paix","line2":null,"city":"Paris","region":"Île-de-France","postal_code":"75002","country":"France","phone":"+33 6 12 34 56 01"}'::jsonb,
    'elena.marchand@example.com',
    timezone('utc', now()) - interval '5 days' + interval '12 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000010',
    'VR-DEMO0010',
    'a1000000-0000-4000-8000-000000000002',
    'cancelled',
    138.00, 0, 18.00, 11.39, 167.39,
    NULL,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    '{"full_name":"James Whitfield","line1":"220 Hudson Street","line2":"Apt 8B","city":"New York","region":"NY","postal_code":"10013","country":"United States","phone":"+1 212 555 0142"}'::jsonb,
    'james.whitfield@example.com',
    timezone('utc', now()) - interval '4 days' + interval '8 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000011',
    'VR-DEMO0011',
    'a1000000-0000-4000-8000-000000000003',
    'delivered',
    290.00, 29.00, 0, 21.53, 282.53,
    'NOIR10',
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    '{"full_name":"Sofia Alarcón","line1":"Calle de Serrano 45","line2":null,"city":"Madrid","region":"Madrid","postal_code":"28001","country":"Spain","phone":"+34 612 345 678"}'::jsonb,
    'sofia.alarcon@example.com',
    timezone('utc', now()) - interval '3 days' + interval '17 hours'
  ),
  (
    'b2000000-0000-4000-8000-000000000012',
    'VR-DEMO0012',
    'a1000000-0000-4000-8000-000000000004',
    'confirmed',
    313.00, 0, 0, 25.82, 338.82,
    NULL,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    '{"full_name":"Lucas Bernheim","line1":"Bahnhofstrasse 31","line2":null,"city":"Zürich","region":"ZH","postal_code":"8001","country":"Switzerland","phone":"+41 79 123 45 67"}'::jsonb,
    'lucas.bernheim@example.com',
    timezone('utc', now()) - interval '1 day' + interval '11 hours'
  )
ON CONFLICT (order_number) DO NOTHING;

-- Line items (linked to seeded products/variants)
INSERT INTO public.order_items (
  id, order_id, product_id, variant_id, name_snapshot, volume_snapshot,
  brand_snapshot, image_snapshot, price_snapshot, qty
)
SELECT
  v.item_id,
  v.order_id,
  p.id,
  pv.id,
  p.name,
  pv.volume_ml,
  b.name,
  pi.url,
  v.unit_price,
  v.qty
FROM (
  VALUES
    ('d4000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, 'obsidian-veil', 50, 189.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000002'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'rose-cendre', 30, 125.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000003'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'vetiver-minuit', 30, 135.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000004'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'amber-apparition', 50, 205.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000005'::uuid, 'b2000000-0000-4000-8000-000000000004'::uuid, 'noir-bottle', 30, 140.00::numeric, 2),
    ('d4000000-0000-4000-8000-000000000006'::uuid, 'b2000000-0000-4000-8000-000000000005'::uuid, 'humid-orchid', 50, 172.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000007'::uuid, 'b2000000-0000-4000-8000-000000000006'::uuid, 'obsidian-veil', 100, 360.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000008'::uuid, 'b2000000-0000-4000-8000-000000000007'::uuid, 'resin-archive', 30, 148.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000009'::uuid, 'b2000000-0000-4000-8000-000000000007'::uuid, 'sintered-musk', 30, 112.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000010'::uuid, 'b2000000-0000-4000-8000-000000000008'::uuid, 'vetiver-minuit', 50, 198.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000011'::uuid, 'b2000000-0000-4000-8000-000000000009'::uuid, 'rose-cendre', 50, 185.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000012'::uuid, 'b2000000-0000-4000-8000-000000000010'::uuid, 'amber-apparition', 30, 138.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000013'::uuid, 'b2000000-0000-4000-8000-000000000011'::uuid, 'obsidian-veil', 30, 145.00::numeric, 2),
    ('d4000000-0000-4000-8000-000000000014'::uuid, 'b2000000-0000-4000-8000-000000000012'::uuid, 'noir-bottle', 50, 188.00::numeric, 1),
    ('d4000000-0000-4000-8000-000000000015'::uuid, 'b2000000-0000-4000-8000-000000000012'::uuid, 'rose-cendre', 30, 125.00::numeric, 1)
) AS v(item_id, order_id, slug, volume_ml, unit_price, qty)
JOIN public.products p ON p.slug = v.slug
JOIN public.product_variants pv ON pv.product_id = p.id AND pv.volume_ml = v.volume_ml
LEFT JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN LATERAL (
  SELECT url FROM public.product_images
  WHERE product_id = p.id
  ORDER BY is_primary DESC, sort_order ASC
  LIMIT 1
) pi ON true
WHERE EXISTS (SELECT 1 FROM public.orders o WHERE o.id = v.order_id)
ON CONFLICT (id) DO NOTHING;

-- Extra status notes for a few orders (visible on order detail)
INSERT INTO public.order_status_history (order_id, status, note, created_at)
SELECT o.id, o.status, h.note, o.created_at + interval '2 hours'
FROM public.orders o
JOIN (
  VALUES
    ('VR-DEMO0003', 'shipped', 'Departed Paris hub — tracking shared by email.'),
    ('VR-DEMO0004', 'processing', 'Gift wrap requested.'),
    ('VR-DEMO0009', 'pending', 'Awaiting payment confirmation.'),
    ('VR-DEMO0012', 'confirmed', 'Customer requested evening delivery window.')
) AS h(order_number, status, note)
ON h.order_number = o.order_number
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_status_history existing
  WHERE existing.order_id = o.id AND existing.note = h.note
);

-- Surface low-stock signals on the overview dashboard
UPDATE public.product_variants pv
SET stock = 2, low_stock_threshold = 5
FROM public.products p
WHERE pv.product_id = p.id AND p.slug = 'resin-archive' AND pv.volume_ml = 100;

UPDATE public.product_variants pv
SET stock = 3, low_stock_threshold = 5
FROM public.products p
WHERE pv.product_id = p.id AND p.slug = 'rose-cendre' AND pv.volume_ml = 100;

UPDATE public.product_variants pv
SET stock = 4, low_stock_threshold = 6
FROM public.products p
WHERE pv.product_id = p.id AND p.slug = 'noir-bottle' AND pv.volume_ml = 100;
