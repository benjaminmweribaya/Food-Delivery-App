-- Create demo user profile
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  phone,
  address
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo@grubhubflow.com',
  'Demo User',
  '+1 (555) 123-4567',
  '123 Demo Street, Demo City, DC 12345'
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Create demo restaurants
INSERT INTO public.restaurants (
  id,
  owner_id,
  name,
  description,
  cuisine_type,
  address,
  phone,
  email,
  image_url,
  delivery_fee,
  minimum_order,
  delivery_time_min,
  delivery_time_max,
  rating,
  is_featured,
  is_active
) VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Bella Italia',
  'Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.',
  'Italian',
  '456 Little Italy Ave, Food City, FC 54321',
  '+1 (555) 234-5678',
  'contact@bellaitalia.com',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  3.99,
  15.00,
  25,
  40,
  4.8,
  true,
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Dragon Palace',
  'Traditional Chinese dishes with modern presentation and premium ingredients.',
  'Chinese',
  '789 Chinatown Blvd, Food City, FC 54321',
  '+1 (555) 345-6789',
  'orders@dragonpalace.com',
  'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&h=600&fit=crop',
  2.99,
  20.00,
  30,
  45,
  4.6,
  true,
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Burger Paradise',
  'Gourmet burgers made with premium beef and fresh local ingredients.',
  'American',
  '321 Burger Street, Food City, FC 54321',
  '+1 (555) 456-7890',
  'hello@burgerparadise.com',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
  1.99,
  12.00,
  15,
  30,
  4.7,
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- Create menu categories
INSERT INTO public.menu_categories (
  id,
  restaurant_id,
  name,
  description,
  sort_order
) VALUES 
('cat1-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Appetizers', 'Start your meal with our delicious appetizers', 1),
('cat2-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Main Courses', 'Our signature pasta and pizza dishes', 2),
('cat3-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Appetizers', 'Traditional Chinese starters', 1),
('cat4-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Main Dishes', 'Authentic Chinese main courses', 2),
('cat5-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Burgers', 'Our signature gourmet burgers', 1),
('cat6-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Sides', 'Perfect accompaniments to your meal', 2)
ON CONFLICT (id) DO NOTHING;

-- Create menu items
INSERT INTO public.menu_items (
  id,
  restaurant_id,
  category_id,
  name,
  description,
  price,
  preparation_time,
  is_featured,
  is_available
) VALUES 
-- Bella Italia items
('item1-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'cat1-1111-1111-1111-111111111111', 'Bruschetta Classica', 'Toasted bread topped with fresh tomatoes, basil, and mozzarella', 8.99, 10, true, true),
('item2-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'cat2-2222-2222-2222-222222222222', 'Spaghetti Carbonara', 'Classic Roman pasta with eggs, cheese, and pancetta', 16.99, 15, true, true),
('item3-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'cat2-2222-2222-2222-222222222222', 'Margherita Pizza', 'Traditional pizza with tomato sauce, mozzarella, and fresh basil', 14.99, 20, false, true),

-- Dragon Palace items
('item4-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'cat3-3333-3333-3333-333333333333', 'Spring Rolls', 'Crispy vegetable spring rolls with sweet and sour sauce', 7.99, 8, true, true),
('item5-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'cat4-4444-4444-4444-444444444444', 'Kung Pao Chicken', 'Spicy chicken with peanuts and vegetables in savory sauce', 18.99, 18, true, true),
('item6-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'cat4-4444-4444-4444-444444444444', 'Sweet and Sour Pork', 'Tender pork with pineapple and bell peppers', 17.99, 20, false, true),

-- Burger Paradise items
('item7-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'cat5-5555-5555-5555-555555555555', 'Classic Cheeseburger', 'Juicy beef patty with cheese, lettuce, tomato, and special sauce', 12.99, 12, true, true),
('item8-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'cat5-5555-5555-5555-555555555555', 'BBQ Bacon Burger', 'Premium beef with crispy bacon and BBQ sauce', 15.99, 15, true, true),
('item9-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 'cat6-6666-6666-6666-666666666666', 'Truffle Fries', 'Golden fries with truffle oil and parmesan cheese', 8.99, 8, false, true)
ON CONFLICT (id) DO NOTHING;

-- Create sample orders for demo user
INSERT INTO public.orders (
  id,
  customer_id,
  restaurant_id,
  order_number,
  status,
  payment_status,
  subtotal,
  delivery_fee,
  tax_amount,
  total_amount,
  delivery_address,
  delivery_instructions,
  payment_method,
  estimated_delivery_time,
  created_at
) VALUES 
(
  'order1-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'ORD-20250125-0001',
  'delivered',
  'completed',
  25.98,
  3.99,
  2.08,
  31.05,
  '{"street": "123 Demo Street", "city": "Demo City", "state": "DC", "zipCode": "12345"}',
  'Leave at front door',
  'card',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '3 hours'
),
(
  'order2-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'ORD-20250125-0002',
  'preparing',
  'completed',
  18.99,
  2.99,
  1.52,
  23.50,
  '{"street": "123 Demo Street", "city": "Demo City", "state": "DC", "zipCode": "12345"}',
  'Ring doorbell',
  'card',
  NOW() + INTERVAL '25 minutes',
  NOW() - INTERVAL '10 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Create order items
INSERT INTO public.order_items (
  id,
  order_id,
  menu_item_id,
  quantity,
  unit_price,
  total_price,
  special_instructions
) VALUES 
-- Order 1 items
('oi1-1111-1111-1111-111111111111', 'order1-1111-1111-1111-111111111111', 'item1-1111-1111-1111-111111111111', 1, 8.99, 8.99, 'Extra basil please'),
('oi2-2222-2222-2222-222222222222', 'order1-1111-1111-1111-111111111111', 'item2-2222-2222-2222-222222222222', 1, 16.99, 16.99, NULL),

-- Order 2 items
('oi3-3333-3333-3333-333333333333', 'order2-2222-2222-2222-222222222222', 'item5-5555-5555-5555-555555555555', 1, 18.99, 18.99, 'Medium spice level')
ON CONFLICT (id) DO NOTHING;

-- Add favorites for demo user
INSERT INTO public.favorites (
  id,
  user_id,
  restaurant_id
) VALUES 
('fav1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
('fav2-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;