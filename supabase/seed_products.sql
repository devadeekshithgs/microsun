-- ============================================
-- MICROSUN PRODUCT CATALOG - RESTRUCTURED
-- Products with Variants (Step Configurations)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Clear existing data (run first time only)
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;

-- Step 2: Create Categories (as shown in the app)
INSERT INTO categories (name, description, display_order, is_active) VALUES
  ('Corner Stands', 'Corner storage solutions for kitchens', 1, true),
  ('Fruit Stands', 'Fruity stands and fruit storage', 2, true),
  ('Trolleys', 'Kitchen and utility trolleys', 3, true),
  ('Shelves', 'Wall-mounted and standing shelves', 4, true),
  ('Organizers', 'Table and desk organizers', 5, true),
  ('Plate Stands', 'Plate and dish storage stands', 6, true),
  ('Baskets', 'Storage baskets and tokras', 7, true),
  ('Racks', 'Utility racks for storage', 8, true),
  ('Accessories', 'Kitchen accessories and hooks', 9, true);

-- Step 3: Insert Products with Variants
DO $$
DECLARE
  cat_corner UUID;
  cat_fruit UUID;
  cat_trolleys UUID;
  cat_shelves UUID;
  cat_organizers UUID;
  cat_plate UUID;
  cat_baskets UUID;
  cat_racks UUID;
  cat_accessories UUID;
  prod_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_corner FROM categories WHERE name = 'Corner Stands';
  SELECT id INTO cat_fruit FROM categories WHERE name = 'Fruit Stands';
  SELECT id INTO cat_trolleys FROM categories WHERE name = 'Trolleys';
  SELECT id INTO cat_shelves FROM categories WHERE name = 'Shelves';
  SELECT id INTO cat_organizers FROM categories WHERE name = 'Organizers';
  SELECT id INTO cat_plate FROM categories WHERE name = 'Plate Stands';
  SELECT id INTO cat_baskets FROM categories WHERE name = 'Baskets';
  SELECT id INTO cat_racks FROM categories WHERE name = 'Racks';
  SELECT id INTO cat_accessories FROM categories WHERE name = 'Accessories';

  -- =====================
  -- SHELVES CATEGORY
  -- =====================
  
  -- 1. Shelf (1-4 steps)
  INSERT INTO products (name, description, category_id, is_active)
  VALUES ('Shelf', 'Standard kitchen shelf', cat_shelves, true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '1 Step', 'MS-SH-1S', true),
    (prod_id, '2 Step', 'MS-SH-2S', true),
    (prod_id, '3 Step', 'MS-SH-3S', true),
    (prod_id, '4 Step', 'MS-SH-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Small Shelf', 'Compact kitchen shelf', cat_shelves, '/images/products/accessories/hook-shelf.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-SSH-2S', true),
    (prod_id, '3 Step', 'MS-SSH-3S', true),
    (prod_id, '4 Step', 'MS-SSH-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Perforated Sheet Shelf', 'Perforated sheet shelving unit', cat_shelves, '/images/products/accessories/hotpan-grid.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '1 Step', 'MS-PSS-1S', true),
    (prod_id, '2 Step', 'MS-PSS-2S', true),
    (prod_id, '3 Step', 'MS-PSS-3S', true),
    (prod_id, '4 Step', 'MS-PSS-4S', true);

  -- =====================
  -- CORNER STANDS CATEGORY
  -- =====================

  -- 4. L-Corner (1-4 steps)
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('L-Corner', 'L-shaped corner stand', cat_corner, '/images/products/corner-stands/12-inch-corner.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '1 Step', 'MS-LC-1S', true),
    (prod_id, '2 Step', 'MS-LC-2S', true),
    (prod_id, '3 Step', 'MS-LC-3S', true),
    (prod_id, '4 Step', 'MS-LC-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('9" Corner Stand', '9 inch corner stand for kitchen storage', cat_corner, '/images/products/corner-stands/9-inch-corner.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '1 Step', 'MS-CS9-1S', true),
    (prod_id, '2 Step', 'MS-CS9-2S', true),
    (prod_id, '3 Step', 'MS-CS9-3S', true),
    (prod_id, '4 Step', 'MS-CS9-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Special 9" Corner Stand', 'Special 9 inch corner stand', cat_corner, '/images/products/corner-stands/9-inch-corner.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-SCS9-2S', true),
    (prod_id, '3 Step', 'MS-SCS9-3S', true),
    (prod_id, '4 Step', 'MS-SCS9-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('12" Corner Stand', '12 inch corner stand for kitchen storage', cat_corner, '/images/products/corner-stands/12-inch-corner.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '1 Step', 'MS-CS12-1S', true),
    (prod_id, '2 Step', 'MS-CS12-2S', true),
    (prod_id, '3 Step', 'MS-CS12-3S', true),
    (prod_id, '4 Step', 'MS-CS12-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Multipurpose Stand', 'Versatile multipurpose storage stand', cat_corner, '/images/products/organizers/multipurpose-organizer.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-MPS-2S', true),
    (prod_id, '3 Step', 'MS-MPS-3S', true),
    (prod_id, '4 Step', 'MS-MPS-4S', true);

  -- =====================
  -- FRUIT STANDS CATEGORY
  -- =====================

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Fruity 5mm', 'Square fruit stand with 5mm wire', cat_fruit, '/images/products/fruit-stands/square-fruit-stand.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, '2 Step', 'MS-SQF5-2S', true, '/images/products/fruit-stands/square-fruit-stand.png'),
    (prod_id, '3 Step', 'MS-SQF5-3S', true, '/images/products/fruit-stands/square-fruit-stand.png'),
    (prod_id, '4 Step', 'MS-SQF5-4S', true, '/images/products/fruit-stands/square-fruit-stand.png');

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Fruity 8mm', 'Square fruit stand with 8mm wire', cat_fruit, '/images/products/fruit-stands/square-fruit-stand.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, '2 Step', 'MS-SQF8-2S', true, '/images/products/fruit-stands/square-fruit-stand.png'),
    (prod_id, '3 Step', 'MS-SQF8-3S', true, '/images/products/fruit-stands/square-fruit-stand.png'),
    (prod_id, '4 Step', 'MS-SQF8-4S', true, '/images/products/fruit-stands/square-fruit-stand.png');

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Fruity 5mm', 'Round fruit stand with 5mm wire', cat_fruit, '/images/products/fruit-stands/round-fruit-stand-heavy.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, '2 Step', 'MS-RDF5-2S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png'),
    (prod_id, '3 Step', 'MS-RDF5-3S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png'),
    (prod_id, '4 Step', 'MS-RDF5-4S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png');

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Fruity 8mm', 'Round fruit stand with 8mm wire', cat_fruit, '/images/products/fruit-stands/round-fruit-stand-heavy.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, '2 Step', 'MS-RDF8-2S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png'),
    (prod_id, '3 Step', 'MS-RDF8-3S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png'),
    (prod_id, '4 Step', 'MS-RDF8-4S', true, '/images/products/fruit-stands/round-fruit-stand-heavy.png');

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Cycle Fruity', 'Square cycle-style fruit stand', cat_fruit, '/images/products/fruit-stands/square-fruit-stand.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-SQCF-STD', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Cycle Fruity', 'Round cycle-style fruit stand', cat_fruit, '/images/products/fruit-stands/round-fruit-stand-heavy.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-RDCF-STD', true);

  -- =====================
  -- TROLLEYS CATEGORY
  -- =====================

  -- 15. Cylinder Trolley
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Cylinder Trolley', 'Gas cylinder trolley', cat_trolleys, '/images/products/trolleys/cylinder-trolley.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-CT-STD', true);

  -- 16. Square Pipe Fruit Trolley (2-4 steps)
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Pipe Fruit Trolley', 'Fruit trolley with square pipe frame', cat_trolleys, '/images/products/trolleys/square-pipe-trolley.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-SPFT-2S', true),
    (prod_id, '3 Step', 'MS-SPFT-3S', true),
    (prod_id, '4 Step', 'MS-SPFT-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Pipe Fruit Trolley', 'Fruit trolley with round pipe frame', cat_trolleys, '/images/products/trolleys/square-pipe-trolley.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-RPFT-2S', true),
    (prod_id, '3 Step', 'MS-RPFT-3S', true),
    (prod_id, '4 Step', 'MS-RPFT-4S', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Detachable Pipe Trolley', 'Detachable pipe trolley', cat_trolleys, '/images/products/trolleys/cylinder-trolley.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '2 Step', 'MS-DPT-2S', true),
    (prod_id, '3 Step', 'MS-DPT-3S', true),
    (prod_id, '4 Step', 'MS-DPT-4S', true);

  -- =====================
  -- ORGANIZERS CATEGORY
  -- =====================

  -- 19. Filter Stand (baby, small, med, big)
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Filter Stand', 'Filter storage stand', cat_organizers, '/images/products/organizers/glass-stand.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Baby', 'MS-FS-B', true),
    (prod_id, 'Small', 'MS-FS-S', true),
    (prod_id, 'Medium', 'MS-FS-M', true),
    (prod_id, 'Big', 'MS-FS-L', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Water Filter Stand', 'Water filter storage stand', cat_organizers, '/images/products/organizers/glass-stand.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Baby', 'MS-WFS-B', true),
    (prod_id, 'Small', 'MS-WFS-S', true),
    (prod_id, 'Medium', 'MS-WFS-M', true),
    (prod_id, 'Big', 'MS-WFS-L', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Table Organiser', 'Table and desk organizer', cat_organizers, '/images/products/organizers/multipurpose-organizer.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Lite', 'MS-TO-L', true),
    (prod_id, 'Heavy', 'MS-TO-H', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Banana Stand', 'Banana hanging stand', cat_organizers, '/images/products/organizers/banana-stand.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '5mm', 'MS-BS-5', true),
    (prod_id, '8mm', 'MS-BS-8', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Half D Stand', 'Half D shaped stand', cat_organizers, '/images/products/accessories/hook-shelf.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-HDS-STD', true);

  -- 24. Spice Rack
  INSERT INTO products (name, description, category_id, is_active)
  VALUES ('Spice Rack', 'Spice storage rack', cat_organizers, true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, 'Standard', 'MS-SR-STD', true, '/images/products/organizers/spice-rack.jpg');

  -- 25. Perfume Rack
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Perfume Rack', 'Perfume display rack', cat_organizers, '/images/products/organizers/perfume-stand.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, 'Standard', 'MS-PR-STD', true, '/images/products/organizers/perfume-stand.png');

  -- =====================
  -- PLATE STANDS CATEGORY
  -- =====================

  -- 26. Square Plate Stand (6, 8, 10 plates)
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Plate Stand', 'Square plate storage stand', cat_plate, '/images/products/plate-stands/square-plate-stand.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '6 Plate', 'MS-SPS-6', true),
    (prod_id, '8 Plate', 'MS-SPS-8', true),
    (prod_id, '10 Plate', 'MS-SPS-10', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Plate Stand', 'Round plate storage stand', cat_plate, '/images/products/plate-stands/square-plate-stand.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '6 Plate', 'MS-RPS-6', true),
    (prod_id, '8 Plate', 'MS-RPS-8', true),
    (prod_id, '10 Plate', 'MS-RPS-10', true);

  -- =====================
  -- BASKETS CATEGORY
  -- =====================

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Baby Basket', 'Small baby basket', cat_baskets, '/images/products/baskets/square-tokra-no-handle.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small', 'MS-BB-S', true),
    (prod_id, 'Big', 'MS-BB-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Tokra 5mm', 'Square basket with 5mm wire', cat_baskets, '/images/products/baskets/square-tokra-heavy.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (15x20)', 'MS-ST5-S', true),
    (prod_id, 'Big (17x22)', 'MS-ST5-B', true);

  -- 30. Square Tokra 8mm
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Tokra 8mm', 'Square basket with 8mm wire', cat_baskets, '/images/products/baskets/square-tokra-heavy.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (15x20)', 'MS-ST8-S', true),
    (prod_id, 'Big (17x22)', 'MS-ST8-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Tokra 5mm', 'Round basket with 5mm wire', cat_baskets, '/images/products/baskets/round-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small', 'MS-RT5-S', true),
    (prod_id, 'Medium', 'MS-RT5-M', true),
    (prod_id, 'Big', 'MS-RT5-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Tokra 8mm', 'Round basket with 8mm wire', cat_baskets, '/images/products/baskets/round-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small', 'MS-RT8-S', true),
    (prod_id, 'Medium', 'MS-RT8-M', true),
    (prod_id, 'Big', 'MS-RT8-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Tray Tokra (Orange)', 'Orange tray tokra - special item', cat_baskets, '/images/products/baskets/square-tokra-no-handle.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small', 'MS-TTO-S', true),
    (prod_id, 'Big', 'MS-TTO-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Wire Tray Tokra', 'SWTT series basket', cat_baskets, '/images/products/baskets/square-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (SWTT S)', 'MS-SWTT-S', true),
    (prod_id, 'Medium (SWTT M)', 'MS-SWTT-M', true),
    (prod_id, 'Big (SWTT B)', 'MS-SWTT-B', true);

  -- 35. Round Wire Tray Tokra
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Wire Tray Tokra', 'RWTT series basket', cat_baskets, '/images/products/baskets/round-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (RWTT S)', 'MS-RWTT-S', true),
    (prod_id, 'Medium (RWTT M)', 'MS-RWTT-M', true),
    (prod_id, 'Big (RWTT B)', 'MS-RWTT-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Pipe Tray Tokra', 'SPTT series basket', cat_baskets, '/images/products/baskets/square-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (SPTT S)', 'MS-SPTT-S', true),
    (prod_id, 'Medium (SPTT M)', 'MS-SPTT-M', true),
    (prod_id, 'Big (SPTT B)', 'MS-SPTT-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Pipe Tray Tokra', 'RPTT series basket', cat_baskets, '/images/products/baskets/round-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Small (RPTT S)', 'MS-RPTT-S', true),
    (prod_id, 'Medium (RPTT M)', 'MS-RPTT-M', true),
    (prod_id, 'Big (RPTT B)', 'MS-RPTT-B', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Square Pipe Tokra', 'SPT series basket', cat_baskets, '/images/products/baskets/square-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, 'Small (SPT S)', 'MS-SPT-S', true, '/images/products/baskets/square-pipe-tokra.png'),
    (prod_id, 'Medium (SPT M)', 'MS-SPT-M', true, '/images/products/baskets/square-pipe-tokra.png'),
    (prod_id, 'Big (SPT B)', 'MS-SPT-B', true, '/images/products/baskets/square-pipe-tokra.png');

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Round Pipe Tokra', 'RPT series basket', cat_baskets, '/images/products/baskets/round-pipe-tokra.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active, image_url) VALUES
    (prod_id, 'Small (RPT S)', 'MS-RPT-S', true, '/images/products/baskets/round-pipe-tokra.png'),
    (prod_id, 'Medium (RPT M)', 'MS-RPT-M', true, '/images/products/baskets/round-pipe-tokra.png'),
    (prod_id, 'Big (RPT B)', 'MS-RPT-B', true, '/images/products/baskets/round-pipe-tokra.png');

  -- =====================
  -- RACKS CATEGORY
  -- =====================

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('2-Step Utility Rack', '2 step utility rack', cat_racks, '/images/products/racks/utility-rack.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '12 x 12', 'MS-UR2-12x12', true),
    (prod_id, '12 x 15', 'MS-UR2-12x15', true),
    (prod_id, '15 x 15', 'MS-UR2-15x15', true),
    (prod_id, '12 x 18', 'MS-UR2-12x18', true),
    (prod_id, '15 x 18', 'MS-UR2-15x18', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('3-Step Utility Rack', '3 step utility rack', cat_racks, '/images/products/racks/utility-rack.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '21 x 21', 'MS-UR3-21x21', true),
    (prod_id, '21 x 24', 'MS-UR3-21x24', true),
    (prod_id, '24 x 24', 'MS-UR3-24x24', true),
    (prod_id, '24 x 30', 'MS-UR3-24x30', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('4-Step Utility Rack', '4 step utility rack', cat_racks, '/images/products/racks/utility-rack.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '30 x 30', 'MS-UR4-30x30', true),
    (prod_id, '31 x 24', 'MS-UR4-31x24', true);

  -- =====================
  -- ACCESSORIES CATEGORY
  -- =====================

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Hook Shelf', 'Shelf with hooks', cat_accessories, '/images/products/accessories/hook-shelf.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-HS-STD', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Hook Patti', 'Hook rail/patti', cat_accessories, '/images/products/accessories/hook-patti.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, '4 Hook', 'MS-HP-4', true),
    (prod_id, '6 Hook', 'MS-HP-6', true),
    (prod_id, '8 Hook', 'MS-HP-8', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Half Hanger', 'Half-size hanger', cat_accessories, '/images/products/accessories/hanger.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-HH-STD', true);

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Full Hanger', 'Full-size hanger', cat_accessories, '/images/products/accessories/hanger.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-FH-STD', true);

  -- 47. Hanging Ladle Cradle
  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Hanging Ladle Cradle', 'Hanging cradle for ladles', cat_accessories, '/images/products/accessories/ladle-cradle.jpg', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, is_active) VALUES
    (prod_id, 'Standard', 'MS-HLC-STD', true);

  -- =====================
  -- MICROWAVE STANDS CATEGORY
  -- =====================

  -- 48. Microwave Stand
  INSERT INTO categories (name, description, display_order, is_active)
  VALUES ('Microwave Stands', 'Stands for microwave ovens', 10, true)
  RETURNING id INTO cat_organizers; -- Reusing variable, or should declare new one? 
  -- Better to stick to pattern but reuse a variable if not declaring new. 
  -- Actually, let's just reuse cat_racks or similar, or just insert and use a subquery/variable.
  -- Let's define a new variable locally or reuse one. I'll reuse cat_organizers as it's available.

  INSERT INTO products (name, description, category_id, image_url, is_active)
  VALUES ('Microwave Stand', 'Sturdy stand for microwave oven', cat_organizers, '/images/products/microwave-stands/microwave-stand-09171.png', true)
  RETURNING id INTO prod_id;
  
  INSERT INTO product_variants (product_id, variant_name, sku, image_url, is_active) VALUES
    (prod_id, 'Standard', 'MS-MWS-STD', '/images/products/microwave-stands/microwave-stand-09171.png', true),
    (prod_id, 'Design A', 'MS-MWS-dA', '/images/products/microwave-stands/microwave-stand-09154.jpg', true),
    (prod_id, 'Design B', 'MS-MWS-dB', '/images/products/microwave-stands/microwave-stand-09155.jpg', true),
    (prod_id, 'Design C', 'MS-MWS-dC', '/images/products/microwave-stands/microwave-stand-09164.jpg', true),
    (prod_id, 'Design D', 'MS-MWS-dD', '/images/products/microwave-stands/microwave-stand-09165.jpg', true),
    (prod_id, 'Design E', 'MS-MWS-dE', '/images/products/microwave-stands/microwave-stand-09171.png', true);

END $$;

-- =====================
-- VERIFICATION QUERIES
-- =====================

-- Count products per category
SELECT 
  c.name as category,
  COUNT(p.id) as products,
  SUM((SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id)) as total_variants
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name, c.display_order
ORDER BY c.display_order;

-- Total counts
SELECT 
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM product_variants) as total_variants,
  (SELECT COUNT(*) FROM categories) as total_categories;
